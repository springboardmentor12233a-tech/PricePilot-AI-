from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class AIRequest(BaseModel):
    """
    Common request schema for LLM provider endpoints.

    The provider is determined by the API route:
        /api/v2/ai/gemini
        /api/v2/ai/groq
        /api/v2/ai/grok
    """

    model: str = Field(
        ...,
        description="Provider-specific model identifier"
    )

    prompt: str = Field(
        ...,
        min_length=1,
        description="Prompt sent to the AI provider"
    )

    temperature: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=2.0,
        description="Sampling temperature"
    )

    max_tokens: Optional[int] = Field(
        default=None,
        gt=0,
        description="Maximum number of output tokens"
    )

    top_p: Optional[float] = Field(
        default=None,
        gt=0.0,
        le=1.0,
        description="Nucleus sampling parameter"
    )


class AIResponse(BaseModel):
    """
    Standard response returned by Gemini, Groq, and xAI Grok endpoints.
    """

    generated_text: str
    model: str
    usage: Optional[Dict[str, Any]] = None


class PersonalModelRequest(BaseModel):
    """
    Payload for local personal ML model inference.

    `features` maps model feature names to their values.
    """

    features: Dict[str, Any]


class PersonalModelResponse(BaseModel):
    """
    Response returned by the local personal ML model.
    """

    prediction: Any
    model: str = "personal"
    probabilities: Optional[Any] = None