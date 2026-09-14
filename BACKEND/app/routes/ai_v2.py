from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_active_user
from app.schemas.ai_v2 import (
    GeminiRequest,
    GeminiResponse,
    GrokRequest,
    GrokResponse,
    PersonalPredictionRequest,
    PersonalPredictionResponse,
)
from app.services.ai_service import (
    call_gemini,
    call_grok,
    predict_personal_model,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI v2"],
)


@router.post(
    "/gemini",
    response_model=GeminiResponse,
)
async def gemini_v2(
    request: GeminiRequest,
    current_user=Depends(get_current_active_user),
):
    try:
        generated = await call_gemini(
            model=request.model,
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_output_tokens,
            stop_sequences=request.stop_sequences,
        )

        return GeminiResponse(
            id=str(uuid4()),
            model=request.model,
            output=generated,
            metadata=None,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini provider error: {exc}",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected Gemini provider error",
        ) from exc


@router.post(
    "/grok",
    response_model=GrokResponse,
)
async def grok_v2(
    request: GrokRequest,
    current_user=Depends(get_current_active_user),
):
    try:
        generated = await call_grok(
            model=request.model,
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
        )

        return GrokResponse(
            id=str(uuid4()),
            model=request.model,
            output=generated,
            usage=None,
            finish_reason=None,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Grok provider error: {exc}",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected Grok provider error",
        ) from exc


@router.post(
    "/predict",
    response_model=PersonalPredictionResponse,
)
async def personal_predict_v2(
    request: PersonalPredictionRequest,
    current_user=Depends(get_current_active_user),
):
    try:
        result = predict_personal_model(
            request.features
        )

        prediction = result.get("prediction")

        confidence = None

        probabilities = result.get("probabilities")

        if isinstance(probabilities, list) and probabilities:
            confidence = max(probabilities)

        return PersonalPredictionResponse(
            prediction=float(prediction),
            confidence=confidence,
            model_version="v1.0.0",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected personal model error",
        ) from exc