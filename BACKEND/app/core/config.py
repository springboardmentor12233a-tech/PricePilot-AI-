from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # AI provider settings
    GEMINI_API_KEY: str = ""
    XAI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    XAI_MODEL: str = "grok-4.7"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000", "http://localhost:5173",
        "http://127.0.0.1:3000", "http://127.0.0.1:5173",
    ]

    # Local ML model
    PERSONAL_MODEL_PATH: str = "saved_models/pricepilot_xgboost_model_v2.pkl"

    # Default AI generation settings
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 512

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()