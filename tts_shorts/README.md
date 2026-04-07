# YouTube Shorts TTS Generator

Generates original short-form videos from scratch — no source footage needed.

**Pipeline:**
1. **Claude AI** writes a punchy 40-55 second script on your topic
2. **edge-tts** converts the script to natural Microsoft neural speech
3. **moviepy** assembles a 1080×1920 vertical video with word-by-word captions
4. *(Optional)* **YouTube Data API** uploads directly to your channel

## Quick Start

```bash
cd tts_shorts
pip install -r requirements.txt
cp .env.example .env          # add your ANTHROPIC_API_KEY
python main.py "5 sleep hacks"
```

The finished `output/<topic>_short.mp4` is ready to upload to YouTube.

## Usage

```bash
# AI picks the topic
python main.py

# Specific topic
python main.py "surprising facts about honey"

# Different voice (run `edge-tts --list-voices` for options)
python main.py "morning routines" --voice en-US-GuyNeural

# Faster speech, 3 words per chunk
python main.py "productivity tips" --rate +25% --words 3

# Generate and upload immediately (requires client_secrets.json)
python main.py "life hacks" --upload --privacy unlisted
```

## Connecting to YouTube

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → Enable **YouTube Data API v3**
3. **Credentials** → Create **OAuth 2.0 Desktop** credentials
4. Download the JSON and save as `tts_shorts/client_secrets.json`
5. Run with `--upload` — a browser window will open for one-time login

Your token is saved to `.youtube_token.json` and reused automatically.

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `TTS_VOICE` | `en-US-AriaNeural` | edge-tts voice name |
| `TTS_RATE` | `+10%` | Speaking speed (`-50%` to `+100%`) |
| `TTS_VOLUME` | `+0%` | Volume adjustment |
| `WORDS_PER_CHUNK` | `4` | Words per caption card |
| `YOUTUBE_PRIVACY` | `private` | Upload privacy (`private`/`unlisted`/`public`) |

## Requirements

- Python 3.11+
- `ffmpeg` installed system-wide (`apt install ffmpeg` / `brew install ffmpeg`)
