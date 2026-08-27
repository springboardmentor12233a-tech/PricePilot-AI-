"""
Central place where the app reads its configuration from environment
variables (which come from the .env file in local dev).

WHY this exists:
Instead of scattering `os.getenv("DATABASE_URL")` calls across the codebase,
we load everything once into a typed `Settings` object. This gives us:
  1. Autocomplete + type checking (settings.DATABASE_URL, not a raw string key)
  2. A single source of truth for config
  3. Pydantic validates the values on startup — if SECRET_KEY is missing,
     the app fails immediately with a clear error instead of failing later
     at a random point when a token is signed.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str

    # --- Auth ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- App ---
    APP_NAME: str = "PricePilot AI"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Created once, imported everywhere else via `from app.core.config import settings`
settings = Settings()
