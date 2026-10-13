"""
Thin wrapper around the Google Gemini API. GEMINI_API_KEY is read from the
environment only and never exposed to the frontend. Used as the fallback
provider when Groq is unavailable or fails.
"""
from app.core.config import settings


def is_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)


def complete(system_prompt: str, user_prompt: str, max_tokens: int = 800) -> str:
    if not is_configured():
        raise RuntimeError("GEMINI_API_KEY is not configured")

    import google.generativeai as genai  # imported lazily

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        settings.GEMINI_MODEL,
        system_instruction=system_prompt,
    )
    response = model.generate_content(
        user_prompt,
        generation_config={"max_output_tokens": max_tokens, "temperature": 0.2},
    )
    return response.text or ""
