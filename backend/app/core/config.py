"""
Central place where the app reads its configuration from environment variables.
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str = "sqlite:///./pricepilot.db"

    # --- Auth ---
    SECRET_KEY: str = "pricepilot-super-secret-jwt-key-2026-springboard-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # --- App ---
    APP_NAME: str = "PricePilot AI"
    ENVIRONMENT: str = "development"

    # --- External LLM ---
    GROQ_API_KEY: Optional[str] = ""
    GROQ_MODEL: str = "llama-3.1-70b-versatile"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
