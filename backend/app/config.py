"""
PricePilot AI — Backend Configuration
======================================
Centralized configuration management with environment variable loading and
graceful fallbacks.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Project Root Directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Load .env file from project root or backend folder
load_dotenv(ROOT_DIR / ".env", override=False)
load_dotenv(BACKEND_DIR / ".env", override=False)


class Settings:
    """Application settings and runtime constants."""

    APP_NAME: str = "PricePilot AI Backend"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

    # Authentication & JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "default_pricepilot_jwt_secret_change_in_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

    # Server binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS configuration
    DEFAULT_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins_env = os.getenv("ALLOWED_ORIGINS")
        if origins_env:
            return [origin.strip() for origin in origins_env.split(",") if origin.strip()]
        return self.DEFAULT_ORIGINS

    # Gemini LLM Integration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    # Workspace Paths
    MODELS_DIR: Path = ROOT_DIR / "models"
    PRICE_DIR: Path = MODELS_DIR / "price"
    DEMAND_DIR: Path = MODELS_DIR / "demand"
    REVENUE_DIR: Path = MODELS_DIR / "revenue"
    COMPETITOR_DIR: Path = MODELS_DIR / "competitor"
    PROCESSED_DATA_DIR: Path = ROOT_DIR / "Datasets" / "processed"
    RAW_DATA_DIR: Path = ROOT_DIR / "Datasets" / "raw"
    REPORTS_DIR: Path = ROOT_DIR / "eda" / "reports"

    # Specific Model Artifacts
    RF_PRICE_MODEL_PATH: Path = PRICE_DIR / "rf_price_step4.joblib"
    RF_PRICE_META_PATH: Path = PRICE_DIR / "rf_price_step4_meta.joblib"
    PRICE_ENCODER_PATH: Path = PRICE_DIR / "ridge_pipeline.joblib"

    LGBM_DEMAND_MODEL_PATH: Path = DEMAND_DIR / "lgbm_demand_step6.txt"
    LGBM_DEMAND_META_PATH: Path = DEMAND_DIR / "lgbm_demand_step6_meta.joblib"

    REVENUE_META_PATH: Path = REVENUE_DIR / "revenue_engine_meta.joblib"
    COMPETITOR_META_PATH: Path = COMPETITOR_DIR / "competitor_analysis_meta.joblib"

    TEST_DATA_PATH: Path = PROCESSED_DATA_DIR / "test_data.csv.gz"
    CATALOG_PATH: Path = RAW_DATA_DIR / "catalog.csv"
    STORES_PATH: Path = RAW_DATA_DIR / "stores.csv"
    ONLINE_PATH: Path = RAW_DATA_DIR / "online.csv"


settings = Settings()
