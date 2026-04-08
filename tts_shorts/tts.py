"""Text-to-speech with word-level timing.

Primary:  Microsoft edge-tts (neural voices, requires internet)
Fallback: pyttsx3 + espeak-ng (offline, lower quality, estimated timing)
"""

import asyncio
import re
import subprocess
import tempfile
from pathlib import Path

import edge_tts

from config import Config

# 1 second = 10,000,000 ticks (100-ns units)
_TICKS_PER_SEC = 10_000_000


# ---------------------------------------------------------------------------
# edge-tts (primary)
# ---------------------------------------------------------------------------

async def _stream_edge_tts(text: str, voice: str, rate: str, volume: str, audio_path: str) -> list[dict]:
    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
    words: list[dict] = []

    with open(audio_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / _TICKS_PER_SEC
                dur = chunk["duration"] / _TICKS_PER_SEC
                words.append({"text": chunk["text"], "start": start, "end": start + dur})

    return words


# ---------------------------------------------------------------------------
# pyttsx3 fallback (offline)
# ---------------------------------------------------------------------------

def _count_syllables(word: str) -> int:
    """Rough syllable count for timing estimation."""
    word = word.lower().strip(".,!?;:")
    vowels = re.findall(r"[aeiouäöü]+", word)
    return max(1, len(vowels))


def _estimate_timings(words: list[str], total_duration: float) -> list[dict]:
    """
    Proportionally distribute total_duration across words by syllable weight.
    Returns list of {"text", "start", "end"}.
    """
    weights = [_count_syllables(w) for w in words]
    total_weight = sum(weights) or 1

    timings = []
    cursor = 0.0
    for word, weight in zip(words, weights):
        duration = total_duration * (weight / total_weight)
        timings.append({"text": word, "start": cursor, "end": cursor + duration})
        cursor += duration

    return timings


def _wav_duration(wav_path: str) -> float:
    """Read duration of a WAV file without extra dependencies."""
    import wave
    with wave.open(wav_path, "rb") as wf:
        return wf.getnframes() / wf.getframerate()


def _generate_offline(text: str, audio_path: str) -> list[dict]:
    """Generate audio with espeak-ng directly and estimate word timings."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name

    result = subprocess.run(
        ["espeak-ng", text, "-w", wav_path, "-s", "155", "-p", "55"],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"espeak-ng failed:\n{result.stderr.decode()}")

    duration = _wav_duration(wav_path)

    # Convert WAV → MP3 via ffmpeg
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-q:a", "4", audio_path],
        capture_output=True,
    )
    Path(wav_path).unlink(missing_ok=True)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg WAV→MP3 failed:\n{result.stderr.decode()}")

    words = [w for w in text.split() if w]
    return _estimate_timings(words, duration)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_tts(
    text: str,
    audio_path: str,
    voice: str | None = None,
    rate: str | None = None,
    volume: str | None = None,
) -> list[dict]:
    """
    Convert text to speech and return word timing list.

    Tries edge-tts first; falls back to pyttsx3+espeak-ng if network is unavailable.

    Each entry: {"text": str, "start": float, "end": float}  (seconds)
    Audio saved to audio_path as MP3.
    """
    voice = voice or Config.TTS_VOICE
    rate = rate or Config.TTS_RATE
    volume = volume or Config.TTS_VOLUME

    Path(audio_path).parent.mkdir(parents=True, exist_ok=True)

    try:
        words = asyncio.run(_stream_edge_tts(text, voice, rate, volume, audio_path))
        print("  TTS    : edge-tts (neural voice)")
        return words
    except Exception as exc:
        if "name resolution" in str(exc).lower() or "connect" in str(exc).lower():
            print(f"  TTS    : edge-tts unavailable ({type(exc).__name__}) — using offline fallback")
            words = _generate_offline(text, audio_path)
            print("  TTS    : pyttsx3/espeak-ng (offline, estimated timing)")
            return words
        raise


def group_into_chunks(words: list[dict], words_per_chunk: int | None = None) -> list[dict]:
    """
    Group word-level timings into display chunks.

    Each chunk covers from the first word's start to the next chunk's start,
    ensuring text is always visible while speaking.

    Returns list of {"text": str, "start": float, "end": float}.
    """
    n = words_per_chunk or Config.WORDS_PER_CHUNK
    if not words:
        return []

    raw: list[dict] = []
    for i in range(0, len(words), n):
        group = words[i : i + n]
        raw.append(
            {
                "text": " ".join(w["text"] for w in group),
                "start": group[0]["start"],
                "end": group[-1]["end"],
            }
        )

    # Extend each chunk's end to the next chunk's start for seamless display
    for i in range(len(raw) - 1):
        raw[i]["end"] = raw[i + 1]["start"]

    return raw
