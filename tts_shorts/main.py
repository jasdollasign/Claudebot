#!/usr/bin/env python3
"""
YouTube Shorts TTS Generator
─────────────────────────────
Generates an original short-form video from scratch:
  1. Claude AI writes a punchy 40-55 second script on your topic
  2. Microsoft edge-tts converts the script to natural-sounding speech
  3. moviepy assembles a 1080×1920 vertical video with word-by-word captions
  4. (Optional) Uploads directly to YouTube via the Data API

Usage:
  python main.py "5 sleep hacks"
  python main.py --voice en-US-GuyNeural --upload
  python main.py --queue-add "morning routines" "productivity tips"
  python main.py --queue-status
  python main.py --help
"""

import argparse
import sys
from pathlib import Path

# Allow running as `python main.py` from any cwd
sys.path.insert(0, str(Path(__file__).parent))

from config import Config


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Generate a YouTube Short with AI script + TTS narration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "topic",
        nargs="?",
        help="Topic for the video. Omit to let the AI choose.",
    )
    p.add_argument(
        "--voice",
        default=None,
        metavar="VOICE",
        help=f"edge-tts voice name (default: {Config.TTS_VOICE}). "
             "Run `edge-tts --list-voices` to see all options.",
    )
    p.add_argument(
        "--rate",
        default=None,
        metavar="RATE",
        help="TTS speaking rate, e.g. +20%% (default: value from .env)",
    )
    p.add_argument(
        "--words",
        type=int,
        default=None,
        metavar="N",
        help=f"Words per caption chunk (default: {Config.WORDS_PER_CHUNK})",
    )
    p.add_argument(
        "--output",
        default=None,
        metavar="PATH",
        help="Output MP4 path (default: output/short_<topic>.mp4)",
    )
    p.add_argument(
        "--upload",
        action="store_true",
        help="Upload finished video to YouTube",
    )
    p.add_argument(
        "--privacy",
        choices=["private", "unlisted", "public"],
        default=None,
        help="YouTube privacy (default: private). Only used with --upload.",
    )

    # Queue management
    queue_group = p.add_argument_group("topic queue")
    queue_group.add_argument(
        "--queue-add",
        nargs="+",
        metavar="TOPIC",
        help="Add one or more topics to the queue file and exit",
    )
    queue_group.add_argument(
        "--queue-status",
        action="store_true",
        help="Print queue length and exit",
    )
    queue_group.add_argument(
        "--from-queue",
        action="store_true",
        help="Pop the next topic from topics_queue.txt instead of using the positional argument",
    )

    return p.parse_args()


def _slug(text: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "_", text.lower())[:40].strip("_")


def _prompt_topic() -> str | None:
    """
    Interactively ask the user for a topic.
    Returns None if they press Enter with no input (AI picks).
    """
    print()
    print("What should this Short be about?")
    print("  Examples: '5 sleep hacks'  |  'why honey never expires'  |  'morning routines'")
    print("  Press Enter to let Claude pick a topic automatically.")
    print()
    try:
        raw = input("  Topic: ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        raw = ""
    return raw if raw else None


def main() -> None:
    args = _parse_args()

    # ── Queue management commands (no API key needed) ─────────────────────────
    from topics import add_topic, queue_length, pop_next_topic

    if args.queue_add:
        for t in args.queue_add:
            add_topic(t)
            print(f"Queued: {t}")
        print(f"Queue now has {queue_length()} topic(s).")
        return

    if args.queue_status:
        n = queue_length()
        print(f"Queue: {n} topic(s) remaining")
        return

    if not Config.ANTHROPIC_API_KEY:
        print("Error: ANTHROPIC_API_KEY not set. Add it to tts_shorts/.env")
        sys.exit(1)

    Config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Resolve topic: explicit arg → queue → interactive prompt → AI picks
    topic = args.topic
    if not topic and args.from_queue:
        topic = pop_next_topic()
        if topic:
            print(f"Topic from queue: {topic}  ({queue_length()} remaining)")
        else:
            print("Queue empty — falling back to interactive prompt")

    if not topic:
        topic = _prompt_topic()

    # ── 1. Generate script ───────────────────────────────────────────────────
    print()
    print("=" * 50)
    if topic:
        print(f"STEP 1 — Generating script for: {topic} …")
    else:
        print("STEP 1 — Generating script (Claude picks the topic) …")
    from generator import generate_content
    content = generate_content(topic)

    print(f"  Topic  : {content['topic']}")
    print(f"  Title  : {content['title']}")
    words_in_script = len(content["script"].split())
    print(f"  Script : {words_in_script} words")
    print()

    slug = _slug(content["topic"])
    audio_file = str(Config.OUTPUT_DIR / f"{slug}_audio.mp3")
    output_file = args.output or str(Config.OUTPUT_DIR / f"{slug}_short.mp4")

    # ── 2. Text-to-speech ────────────────────────────────────────────────────
    print("STEP 2 — Generating TTS audio …")
    from tts import generate_tts, group_into_chunks
    word_timings = generate_tts(
        content["script"],
        audio_file,
        voice=args.voice,
        rate=args.rate,
    )
    chunks = group_into_chunks(word_timings, args.words)
    audio_dur = word_timings[-1]["end"] if word_timings else 0
    print(f"  Audio  : {audio_dur:.1f}s  ({len(chunks)} caption chunks)")
    print()

    # ── 3. Render video ──────────────────────────────────────────────────────
    print("STEP 3 — Rendering video …")
    from video import create_video
    create_video(chunks, audio_file, output_file, title=content["title"])
    print(f"  Saved  : {output_file}")
    print()

    # ── 4. YouTube upload (optional) ─────────────────────────────────────────
    if args.upload:
        print("STEP 4 — Uploading to YouTube …")
        from uploader import upload_short
        url = upload_short(
            output_file,
            content["title"],
            content["description"],
            content["tags"],
            privacy=args.privacy,
        )
        print(f"  URL    : {url}")
        print()

    print("=" * 50)
    print("Done!")
    if not args.upload:
        print(f"Video ready: {output_file}")
        print("Run with --upload to publish to YouTube.")


if __name__ == "__main__":
    main()
