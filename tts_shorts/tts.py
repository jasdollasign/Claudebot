"""Text-to-speech using Microsoft edge-tts with word-level timing."""

import asyncio
from pathlib import Path
import edge_tts
from config import Config

# 1 second = 10,000,000 ticks (100-ns units)
_TICKS_PER_SEC = 10_000_000


async def _stream_tts(text: str, voice: str, rate: str, volume: str, audio_path: str) -> list[dict]:
    """Stream TTS audio to file and collect word boundary events."""
    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
    words: list[dict] = []

    with open(audio_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / _TICKS_PER_SEC
                dur = chunk["duration"] / _TICKS_PER_SEC
                words.append(
                    {
                        "text": chunk["text"],
                        "start": start,
                        "end": start + dur,
                    }
                )

    return words


def generate_tts(
    text: str,
    audio_path: str,
    voice: str | None = None,
    rate: str | None = None,
    volume: str | None = None,
) -> list[dict]:
    """
    Convert text to speech and return word timing list.

    Each entry: {"text": str, "start": float, "end": float}  (seconds)
    Audio saved to audio_path as MP3.
    """
    voice = voice or Config.TTS_VOICE
    rate = rate or Config.TTS_RATE
    volume = volume or Config.TTS_VOLUME

    Path(audio_path).parent.mkdir(parents=True, exist_ok=True)

    return asyncio.run(_stream_tts(text, voice, rate, volume, audio_path))


def group_into_chunks(words: list[dict], words_per_chunk: int | None = None) -> list[dict]:
    """
    Group word-level timings into display chunks.

    Each chunk covers from the first word's start to the next chunk's start
    (or the last word's end), ensuring text is always visible while speaking.

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
