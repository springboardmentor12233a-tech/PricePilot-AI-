"""
Thin wrapper around the Groq API. The API key is read from the environment
only (GROQ_API_KEY) and is never sent to or exposed on the frontend. All
Groq calls happen on the backend.
"""
from app.core.config import settings


def is_configured() -> bool:
    return bool(settings.GROQ_API_KEY)


def complete(system_prompt: str, user_prompt: str, max_tokens: int = 800) -> str:
    """Raises on failure so the caller (ai_service.py) can fall back to Gemini."""
    if not is_configured():
        raise RuntimeError("GROQ_API_KEY is not configured")

    from groq import Groq  # imported lazily so the app still starts without the package at runtime

    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.2,
    )
    return response.choices[0].message.content or ""
