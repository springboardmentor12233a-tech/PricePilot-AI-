from ipaddress import ip_network
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    GEMINI_API_KEY: str = ""
    XAI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    XAI_MODEL: str = "grok-4.7"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000", "http://localhost:5173",
        "http://127.0.0.1:3000", "http://127.0.0.1:5173",
    ]
    PERSONAL_MODEL_PATH: str = "saved_models/pricepilot_xgboost_model_v2.pkl"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 512

    OTP_EMAIL_PROVIDER: Literal["disabled", "smtp"] = "disabled"
    OTP_EMAIL_FROM: str = ""
    OTP_SMTP_HOST: str = ""
    OTP_SMTP_PORT: int = 587
    OTP_SMTP_USERNAME: str = ""
    OTP_SMTP_PASSWORD: str = ""
    OTP_SMTP_USE_TLS: bool = True
    OTP_HASH_SECRET: str = ""
    OTP_EXPIRY_SECONDS: int = Field(default=300, gt=0, le=3600)
    OTP_RESEND_COOLDOWN_SECONDS: int = Field(default=60, ge=0, le=3600)
    OTP_MAX_ATTEMPTS: int = Field(default=5, ge=1, le=20)
    OTP_LOGIN_RATE_LIMIT: int = Field(default=10, ge=1, le=100)
    AUTH_RATE_WINDOW_SECONDS: int = Field(default=900, ge=60, le=86400)

    SESSION_COOKIE_SECURE: bool = True
    SESSION_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    TRUSTED_PROXY_CIDRS: list[str] = []
    GEOLOCATION_API_URL: str = ""
    GEOLOCATION_API_TOKEN: str = ""

    @field_validator("TRUSTED_PROXY_CIDRS")
    @classmethod
    def validate_trusted_proxies(cls, values: list[str]) -> list[str]:
        for value in values:
            ip_network(value, strict=False)
        return values

    @model_validator(mode="after")
    def validate_email_and_cookie_settings(self):
        if self.OTP_EMAIL_PROVIDER == "smtp" and not (self.OTP_EMAIL_FROM and self.OTP_SMTP_HOST):
            raise ValueError("SMTP OTP delivery requires OTP_EMAIL_FROM and OTP_SMTP_HOST")
        if self.SESSION_COOKIE_SAMESITE == "none" and not self.SESSION_COOKIE_SECURE:
            raise ValueError("SameSite=None refresh cookies must be Secure")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()