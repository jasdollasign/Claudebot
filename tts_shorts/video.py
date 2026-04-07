"""Create a vertical 9:16 YouTube Short from text chunks and an audio file."""

import os
import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
try:
    from moviepy import AudioFileClip, CompositeVideoClip, ImageClip  # moviepy 2.x
    import moviepy.video.fx as vfx
    _MOVIEPY_V2 = True
except ImportError:
    from moviepy.editor import AudioFileClip, CompositeVideoClip, ImageClip  # moviepy 1.x
    _MOVIEPY_V2 = False

from config import Config


# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in Config.FONT_PATHS:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------

def _make_background(width: int, height: int) -> Image.Image:
    """Dark vertical gradient, deep navy → near-black."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / height
        r = int(8 + t * 6)
        g = int(8 + t * 4)
        b = int(30 + t * 20)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img


# ---------------------------------------------------------------------------
# Frame builder
# ---------------------------------------------------------------------------

def _render_frame(
    text: str,
    title: str,
    progress: float,
    width: int,
    height: int,
) -> np.ndarray:
    img = _make_background(width, height)
    draw = ImageDraw.Draw(img)

    pad = 70  # horizontal padding
    inner_w = width - pad * 2

    # --- Title (top, smaller, muted) ---
    if title:
        title_clean = title.replace("#Shorts", "").replace("#shorts", "").strip()
        title_font = _load_font(42)
        # Wrap to inner width
        lines: list[str] = []
        for word in title_clean.split():
            if not lines:
                lines.append(word)
            else:
                test = lines[-1] + " " + word
                bbox = draw.textbbox((0, 0), test, font=title_font)
                if bbox[2] - bbox[0] <= inner_w:
                    lines[-1] = test
                else:
                    lines.append(word)
            if len(lines) >= 2:
                break  # cap at 2 lines

        y = 90
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=title_font)
            x = (width - (bbox[2] - bbox[0])) // 2
            # Subtle shadow
            draw.text((x + 2, y + 2), line, font=title_font, fill=(0, 0, 0))
            draw.text((x, y), line, font=title_font, fill=(160, 170, 210))
            y += bbox[3] - bbox[1] + 8

    # --- Main chunk text (center, large, yellow) ---
    if text:
        main_font = _load_font(96)
        line_h = 115

        # Wrap text to inner width
        words = text.split()
        lines_main: list[str] = []
        for word in words:
            if not lines_main:
                lines_main.append(word)
            else:
                test = lines_main[-1] + " " + word
                bbox = draw.textbbox((0, 0), test, font=main_font)
                if bbox[2] - bbox[0] <= inner_w:
                    lines_main[-1] = test
                else:
                    lines_main.append(word)

        total_h = len(lines_main) * line_h
        y = (height - total_h) // 2

        for line in lines_main:
            bbox = draw.textbbox((0, 0), line, font=main_font)
            x = (width - (bbox[2] - bbox[0])) // 2
            # Drop shadow
            draw.text((x + 4, y + 4), line, font=main_font, fill=(0, 0, 0))
            # Main text: bright yellow — pops on dark bg
            draw.text((x, y), line, font=main_font, fill=(255, 230, 30))
            y += line_h

    # --- Progress bar (bottom) ---
    bar_h = 14
    bar_y = height - 60
    bar_x = pad
    bar_w = width - pad * 2
    # Track
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], radius=7, fill=(40, 45, 70))
    # Fill
    if progress > 0:
        fill_w = max(bar_h, int(bar_w * min(progress, 1.0)))
        draw.rounded_rectangle([bar_x, bar_y, bar_x + fill_w, bar_y + bar_h], radius=7, fill=(255, 210, 30))

    return np.array(img)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_video(
    chunks: list[dict],
    audio_file: str,
    output_file: str,
    title: str = "",
) -> str:
    """
    Assemble a vertical MP4 Short from timed text chunks + audio.

    chunks: list of {"text": str, "start": float, "end": float}
    Returns the output_file path.
    """
    audio = AudioFileClip(audio_file)
    total = audio.duration

    w, h = Config.VIDEO_WIDTH, Config.VIDEO_HEIGHT

    # Static background base
    bg_arr = _make_background(w, h)
    base = ImageClip(np.array(bg_arr), duration=total)

    text_clips: list[ImageClip] = []
    for chunk in chunks:
        start = chunk["start"]
        end = min(chunk["end"], total)
        duration = end - start
        if duration <= 0:
            continue

        progress = (start + end) / 2 / total
        frame = _render_frame(chunk["text"], title, progress, w, h)

        base_clip = ImageClip(frame, duration=duration)
        if _MOVIEPY_V2:
            clip = base_clip.with_start(start).with_effects([vfx.CrossFadeIn(0.08)])
        else:
            clip = base_clip.set_start(start).crossfadein(0.08)
        text_clips.append(clip)

    if _MOVIEPY_V2:
        composite = CompositeVideoClip([base] + text_clips, size=(w, h))
        video = composite.with_audio(audio)
    else:
        video = CompositeVideoClip([base] + text_clips, size=(w, h)).set_audio(audio)

    Path(output_file).parent.mkdir(parents=True, exist_ok=True)

    print(f"  Rendering {total:.1f}s of video …")
    video.write_videofile(
        output_file,
        fps=Config.VIDEO_FPS,
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        ffmpeg_params=["-crf", "20"],
        verbose=False,
        logger=None,
    )

    return output_file
