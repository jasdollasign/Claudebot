import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Config:
    # API Keys — set ONE of these in .env
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Model names per provider
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4.5")

    # TTS
    TTS_VOICE: str = os.getenv("TTS_VOICE", "en-US-AriaNeural")
    TTS_RATE: str = os.getenv("TTS_RATE", "+10%")
    TTS_VOLUME: str = os.getenv("TTS_VOLUME", "+0%")

    # Video dimensions (9:16 vertical for Shorts)
    VIDEO_WIDTH: int = 1080
    VIDEO_HEIGHT: int = 1920
    VIDEO_FPS: int = 30

    # How many words to show at once
    WORDS_PER_CHUNK: int = int(os.getenv("WORDS_PER_CHUNK", "4"))

    # Output
    OUTPUT_DIR: Path = Path("output")

    # YouTube OAuth2
    YOUTUBE_CLIENT_SECRETS: str = os.getenv("YOUTUBE_CLIENT_SECRETS", "client_secrets.json")
    YOUTUBE_CREDENTIALS: str = os.getenv("YOUTUBE_CREDENTIALS", ".youtube_token.json")
    YOUTUBE_CATEGORY_ID: str = "22"  # People & Blogs
    YOUTUBE_PRIVACY: str = os.getenv("YOUTUBE_PRIVACY", "private")

    # Font paths (tried in order, first found wins)
    FONT_PATHS: list = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/usr/share/fonts/truetype/ubuntu/Ubuntu-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    ]
