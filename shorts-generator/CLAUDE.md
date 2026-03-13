# AI YouTube Shorts Generator

Converts long-form YouTube videos or local video files into vertical short-form clips (9:16) with burned-in subtitles. Uses GPT-4o-mini for highlight selection and Whisper for transcription.

## Setup

```bash
cd shorts-generator
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt        # GPU (CUDA)
# pip install -r requirements-cpu.txt  # CPU only
cp .env.example .env                   # add OPENAI_API_KEY
```

System deps required: `ffmpeg`, `imagemagick`.

## Usage

```bash
# From YouTube URL
python main.py https://youtube.com/watch?v=...

# From local file
python main.py /path/to/video.mp4

# Batch/non-interactive (auto-approves highlight selections)
python main.py <url> --auto-approve
```

## Pipeline

1. **Download** — yt-dlp fetches the video
2. **Transcribe** — faster-whisper produces timestamped transcript
3. **Highlight** — GPT-4o-mini selects the best ~60s segment
4. **Crop** — OpenCV face-detection or motion-tracking for vertical 9:16 frame
5. **Subtitles** — Burns styled captions via ImageMagick + moviepy
6. Output saved to `output/`

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Required — used for GPT-4o-mini and Whisper API |

## Docker

```bash
docker-compose up
```
