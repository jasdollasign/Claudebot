# YouTube Shorts TTS Generator

Generates original short-form videos from scratch — no source footage needed.

**4-step pipeline:**
1. **Claude AI** writes a punchy 40-55 second script on your topic
2. **edge-tts** converts the script to natural Microsoft neural speech (free, no key)
3. **moviepy** assembles a 1080×1920 vertical video with word-by-word captions
4. *(Optional)* **YouTube Data API** uploads directly to your channel

---

## Quick Start

```bash
cd tts_shorts
pip install -r requirements.txt
cp .env.example .env          # add your ANTHROPIC_API_KEY
python main.py "5 sleep hacks"
```

Output: `output/<topic>_short.mp4` — ready to upload.

---

## One-off Usage

```bash
# AI picks the topic
python main.py

# Specific topic
python main.py "surprising facts about honey"

# Different voice
python main.py "morning routines" --voice en-US-GuyNeural

# Faster speech, 3 words per caption chunk
python main.py "productivity tips" --rate +25% --words 3

# Generate and upload immediately
python main.py "life hacks" --upload --privacy unlisted
```

---

## Autonomous Mode (Scheduler)

Run the scheduler to automatically generate and upload Shorts on a timer.

### 1. Fill the topic queue

```bash
# Add topics one at a time
python main.py --queue-add "cold shower benefits" "why we dream" "sleep hacks"

# Or edit topics_queue.txt directly — one topic per line
```

### 2. Start the scheduler

```bash
# Generate every 6 hours, upload as private drafts
python scheduler.py --interval 6h --upload --privacy private

# Generate every 4 hours, don't upload (review manually)
python scheduler.py --interval 4h

# Upload publicly every 12 hours, starting immediately
python scheduler.py --interval 12h --upload --privacy public --run-now
```

The scheduler:
- Pops the next topic from `topics_queue.txt` each run (AI picks when queue is empty)
- Logs all activity to `output/scheduler.log`
- Survives errors (bad API response, network blip) and retries next interval
- Gracefully stops on `Ctrl+C` or `SIGTERM`

### Run as a background service (Linux)

```bash
nohup python scheduler.py --interval 6h --upload --privacy private >> output/scheduler.log 2>&1 &
echo $! > output/scheduler.pid
```

To stop: `kill $(cat output/scheduler.pid)`

---

## Connecting to YouTube

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project
2. **APIs & Services** → **Enable APIs** → search **YouTube Data API v3** → Enable
3. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID** → Desktop app
4. Download the JSON → save as `tts_shorts/client_secrets.json`
5. First `--upload` run opens a browser for one-time login; token is cached in `.youtube_token.json`

---

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `TTS_VOICE` | `en-US-AriaNeural` | edge-tts voice name |
| `TTS_RATE` | `+10%` | Speaking speed (`-50%` to `+100%`) |
| `TTS_VOLUME` | `+0%` | Volume adjustment |
| `WORDS_PER_CHUNK` | `4` | Words per caption card |
| `YOUTUBE_PRIVACY` | `private` | Default upload privacy |
| `YOUTUBE_CLIENT_SECRETS` | `client_secrets.json` | OAuth2 credentials file |

## Voice Options

```bash
# List all available neural voices
edge-tts --list-voices

# Popular choices
en-US-AriaNeural     # female, warm (default)
en-US-GuyNeural      # male, clear
en-US-JennyNeural    # female, friendly
en-GB-SoniaNeural    # British female
en-AU-NatashaNeural  # Australian female
```

## Requirements

- Python 3.11+
- `ffmpeg` installed system-wide:
  - Ubuntu/Debian: `apt install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: download from ffmpeg.org
