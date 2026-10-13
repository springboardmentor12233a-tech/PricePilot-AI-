"""
Central application configuration, loaded from environment variables (.env).
No secrets are hard-coded here -- everything sensitive comes from the
environment so it never ends up committed to source control.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        extra="ignore",
    )

    # --- App ---
    APP_NAME: str = "PricePilot AI"
    ENV: str = "development"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/pricepilot"

    # --- Auth ---
    JWT_SECRET_KEY: str = "CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    FRONTEND_URL: str = "http://localhost:5173"

    # --- AI providers (never sent to the frontend) ---
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # --- Admin bootstrap ---
    ADMIN_EMAIL: str = "admin@pricepilot.local"
    ADMIN_PASSWORD: str = "ChangeMe123!"

    # --- Paths ---
    DATA_RAW_DIR: str = "../data/raw"
    DATA_PROCESSED_DIR: str = "../data/processed"
    MODELS_DIR: str = "../models"
    REPORTS_DIR: str = "../reports"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
