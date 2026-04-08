"""
Autonomous scheduler — generates and uploads one Short per interval.

Usage:
  # Upload every 6 hours, reading topics from the queue file
  python scheduler.py --interval 6h --upload

  # Generate-only every 4 hours (no upload), AI picks topics
  python scheduler.py --interval 4h

  # Run once immediately, then every 12 hours
  python scheduler.py --interval 12h --upload --run-now
"""

import argparse
import logging
import signal
import sys
import time
from datetime import datetime
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from topics import pop_next_topic, queue_length

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("shorts-scheduler")

_LOG_FILE = Config.OUTPUT_DIR / "scheduler.log"


def _file_handler() -> logging.FileHandler:
    Config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fh = logging.FileHandler(_LOG_FILE)
    fh.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-8s  %(message)s"))
    return fh


# ---------------------------------------------------------------------------
# Job
# ---------------------------------------------------------------------------

def run_job(upload: bool, privacy: str | None, voice: str | None, rate: str | None) -> None:
    """Generate (and optionally upload) one YouTube Short."""
    log.info("=" * 55)
    log.info("Job started — %s", datetime.now().strftime("%A %d %b %Y %H:%M"))

    topic = pop_next_topic()
    if topic:
        log.info("Topic from queue: %s  (%d remaining)", topic, queue_length())
    else:
        log.info("Queue empty — Claude will pick a topic")

    try:
        # ── 1. Script ──────────────────────────────────────────────────────
        log.info("Generating script …")
        from generator import generate_content
        content = generate_content(topic)
        log.info("Title: %s", content["title"])
        log.info("Words: %d", len(content["script"].split()))

        # ── 2. TTS ─────────────────────────────────────────────────────────
        import re
        slug = re.sub(r"[^a-z0-9]+", "_", content["topic"].lower())[:40].strip("_")
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        audio_file = str(Config.OUTPUT_DIR / f"{ts}_{slug}_audio.mp3")
        video_file = str(Config.OUTPUT_DIR / f"{ts}_{slug}_short.mp4")

        log.info("Generating TTS …")
        from tts import generate_tts, group_into_chunks
        words = generate_tts(content["script"], audio_file, voice=voice, rate=rate)
        chunks = group_into_chunks(words)
        audio_dur = words[-1]["end"] if words else 0
        log.info("Audio: %.1fs (%d chunks)", audio_dur, len(chunks))

        # ── 3. Video ───────────────────────────────────────────────────────
        log.info("Rendering video …")
        from video import create_video
        create_video(chunks, audio_file, video_file, title=content["title"])
        log.info("Video saved: %s", video_file)

        # ── 4. Upload ──────────────────────────────────────────────────────
        if upload:
            log.info("Uploading to YouTube …")
            from uploader import upload_short
            url = upload_short(
                video_file,
                content["title"],
                content["description"],
                content["tags"],
                privacy=privacy,
            )
            log.info("Published: %s", url)
        else:
            log.info("Upload skipped (run with --upload to publish)")

        log.info("Job complete.")

    except Exception as exc:
        log.exception("Job failed: %s", exc)
        # Don't crash the scheduler — just log and continue next interval


# ---------------------------------------------------------------------------
# Interval parser
# ---------------------------------------------------------------------------

def _parse_interval(value: str) -> dict:
    """Parse '6h', '30m', '2h30m' → kwargs for IntervalTrigger."""
    import re
    value = value.lower().strip()
    hours = minutes = 0
    m = re.search(r"(\d+)h", value)
    if m:
        hours = int(m.group(1))
    m = re.search(r"(\d+)m", value)
    if m:
        minutes = int(m.group(1))
    if hours == 0 and minutes == 0:
        raise argparse.ArgumentTypeError(
            f"Cannot parse interval '{value}'. Use formats like '6h', '30m', '2h30m'."
        )
    return {"hours": hours, "minutes": minutes}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    p = argparse.ArgumentParser(
        description="Autonomous YouTube Shorts scheduler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--interval",
        default="6h",
        metavar="INTERVAL",
        help="How often to generate a Short, e.g. 6h, 30m, 2h30m (default: 6h)",
    )
    p.add_argument(
        "--upload",
        action="store_true",
        help="Upload each finished video to YouTube",
    )
    p.add_argument(
        "--privacy",
        choices=["private", "unlisted", "public"],
        default=None,
        help="YouTube privacy (default: value from .env / 'private')",
    )
    p.add_argument(
        "--voice",
        default=None,
        metavar="VOICE",
        help="edge-tts voice override (default: value from .env)",
    )
    p.add_argument(
        "--rate",
        default=None,
        metavar="RATE",
        help="TTS rate override, e.g. +20%% (default: value from .env)",
    )
    p.add_argument(
        "--run-now",
        action="store_true",
        help="Run one job immediately before starting the schedule",
    )
    args = p.parse_args()

    # Wire file logging
    logging.getLogger().addHandler(_file_handler())

    interval_kwargs = _parse_interval(args.interval)
    hours = interval_kwargs.get("hours", 0)
    minutes = interval_kwargs.get("minutes", 0)
    human_interval = f"{hours}h {minutes}m".strip() if hours and minutes else f"{hours}h" if hours else f"{minutes}m"

    log.info("Shorts scheduler starting")
    log.info("  Interval : %s", human_interval)
    log.info("  Upload   : %s", "yes" if args.upload else "no (generate only)")
    log.info("  Privacy  : %s", args.privacy or Config.YOUTUBE_PRIVACY)
    log.info("  Topics   : %d queued", queue_length())
    log.info("  Log file : %s", _LOG_FILE)

    job_kwargs = dict(upload=args.upload, privacy=args.privacy, voice=args.voice, rate=args.rate)

    if args.run_now:
        log.info("Running immediately (--run-now) …")
        run_job(**job_kwargs)

    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        run_job,
        trigger=IntervalTrigger(**interval_kwargs),
        kwargs=job_kwargs,
        id="shorts_job",
        name="Generate & upload YouTube Short",
        misfire_grace_time=300,  # 5 min grace if job was missed
        coalesce=True,           # Don't pile up missed runs
    )

    def _shutdown(sig, frame):
        log.info("Shutdown signal received — stopping scheduler")
        scheduler.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    next_run = scheduler.get_jobs()[0].next_run_time if scheduler.get_jobs() else "unknown"
    log.info("Scheduler running. First job at: %s  (Ctrl+C to stop)", next_run)
    scheduler.start()


if __name__ == "__main__":
    main()
