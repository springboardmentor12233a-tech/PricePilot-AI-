from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# Gemini
# ============================================================

class GeminiRequest(BaseModel):
    model: str = Field(
        default="gemini-3.5-flash",
        min_length=1,
    )

    prompt: str = Field(
        ...,
        min_length=1,
    )

    temperature: Optional[float] = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
    )

    max_output_tokens: Optional[int] = Field(
        default=512,
        gt=0,
    )

    stop_sequences: Optional[List[str]] = None


class GeminiUsage(BaseModel):
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


class GeminiMetadata(BaseModel):
    usage: Optional[GeminiUsage] = None
    finish_reason: Optional[str] = None


class GeminiResponse(BaseModel):
    id: str
    model: str
    output: str
    metadata: Optional[GeminiMetadata] = None


# ============================================================
# Grok / xAI
# ============================================================

class GrokRequest(BaseModel):
    model: str = Field(
        default="grok-4.6",
        min_length=1,
    )

    prompt: str = Field(
        ...,
        min_length=1,
    )

    temperature: Optional[float] = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
    )

    max_tokens: Optional[int] = Field(
        default=512,
        gt=0,
    )

    top_p: Optional[float] = Field(
        default=0.9,
        gt=0.0,
        le=1.0,
    )


class GrokResponse(BaseModel):
    id: str
    model: str
    output: str
    usage: Optional[Dict[str, Any]] = None
    finish_reason: Optional[str] = None


# ============================================================
# Personal ML Model
# ============================================================

class PersonalPredictionRequest(BaseModel):
    features: Dict[str, Any]


class PersonalPredictionResponse(BaseModel):
    model_config = ConfigDict(
        protected_namespaces=()
    )

    prediction: float
    confidence: Optional[float] = None
    model_version: str
    timestamp: str