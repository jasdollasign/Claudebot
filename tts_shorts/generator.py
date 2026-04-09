"""Generate YouTube Shorts scripts via Claude.

Supports two providers:
  1. Anthropic direct  (ANTHROPIC_API_KEY=sk-ant-...)
  2. OpenRouter        (OPENROUTER_API_KEY=sk-or-...)

Auto-detects which one to use based on whichever key is set in .env.
"""

import json
import re

from config import Config


def _generate_anthropic(system: str, user_prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=Config.ANTHROPIC_MODEL,
        max_tokens=700,
        system=system,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text.strip()


def _generate_openrouter(system: str, user_prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=Config.OPENROUTER_API_KEY,
    )
    response = client.chat.completions.create(
        model=Config.OPENROUTER_MODEL,
        max_tokens=700,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content.strip()


def generate_content(topic: str | None = None) -> dict:
    """
    Generate a complete YouTube Shorts content package.

    Returns a dict with keys: title, description, tags, script, topic
    """
    if not (Config.ANTHROPIC_API_KEY or Config.OPENROUTER_API_KEY):
        raise ValueError(
            "No API key set. Add either ANTHROPIC_API_KEY or OPENROUTER_API_KEY to your .env file."
        )

    system = (
        "You are an expert YouTube Shorts content creator who writes viral short-form scripts. "
        "Your scripts are spoken aloud by a text-to-speech engine, so every word must sound natural "
        "when read out loud. Follow these rules:\n"
        "- Script must be 40-55 seconds at normal speaking pace (~110-140 words)\n"
        "- Open with a hook that grabs attention in the first 3 seconds\n"
        "- Use short punchy sentences — max 12 words each\n"
        "- No bullet points, headers, or markdown — plain flowing prose only\n"
        "- Avoid abbreviations, symbols, or words TTS tends to mispronounce\n"
        "- End with a call to action (like, follow, comment)\n"
        "- Respond ONLY with a valid JSON object — no markdown fences, no extra text"
    )

    topic_line = (
        f"Topic: {topic}"
        if topic
        else "Pick any surprising fact, life hack, or tip that performs well on YouTube."
    )

    user_prompt = (
        f"{topic_line}\n\n"
        "Return this exact JSON structure:\n"
        "{\n"
        '  "title": "Catchy YouTube title under 70 characters, must include #Shorts",\n'
        '  "description": "2-3 sentence description followed by 5-8 relevant hashtags",\n'
        '  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],\n'
        '  "script": "The full narration script, plain text only",\n'
        '  "topic": "One-line description of the specific topic covered"\n'
        "}"
    )

    # Prefer OpenRouter if its key is set (lets user override default Anthropic)
    if Config.OPENROUTER_API_KEY:
        raw = _generate_openrouter(system, user_prompt)
    else:
        raw = _generate_anthropic(system, user_prompt)

    # Strip markdown fences if the model adds them despite instructions
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        content = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model returned invalid JSON:\n{raw}") from exc

    required = {"title", "description", "tags", "script", "topic"}
    missing = required - content.keys()
    if missing:
        raise ValueError(f"Model response missing fields: {missing}")

    return content
