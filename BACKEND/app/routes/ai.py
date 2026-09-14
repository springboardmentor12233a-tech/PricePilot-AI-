from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_active_user
from app.schemas.ai import (
    AIRequest,
    AIResponse,
    PersonalModelRequest,
    PersonalModelResponse,
)
from app.services.ai_service import (
    call_gemini,
    call_groq,
    call_grok,
    predict_personal_model,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# ============================================================
# Google Gemini
# POST /api/v2/ai/gemini
# ============================================================

@router.post(
    "/gemini",
    response_model=AIResponse,
)
async def gemini_endpoint(
    request: AIRequest,
    current_user=Depends(get_current_active_user),
):
    try:
        generated = await call_gemini(
            model=request.model,
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        return AIResponse(
            generated_text=generated,
            model=request.model,
            usage=None,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini provider error: {str(e)}",
        )


# ============================================================
# Groq
# POST /api/v2/ai/groq
# ============================================================

@router.post(
    "/groq",
    response_model=AIResponse,
)
async def groq_endpoint(
    request: AIRequest,
    current_user=Depends(get_current_active_user),
):
    try:
        generated = await call_groq(
            model=request.model,
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
        )

        return AIResponse(
            generated_text=generated,
            model=request.model,
            usage=None,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq provider error: {str(e)}",
        )


# ============================================================
# xAI Grok
# POST /api/v2/ai/grok
# ============================================================

@router.post(
    "/grok",
    response_model=AIResponse,
)
async def grok_endpoint(
    request: AIRequest,
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

        return AIResponse(
            generated_text=generated,
            model=request.model,
            usage=None,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"xAI Grok provider error: {str(e)}",
        )


# ============================================================
# Personal ML Model
# POST /api/v2/ai/predict
# ============================================================

@router.post(
    "/predict",
    response_model=PersonalModelResponse,
)
async def personal_endpoint(
    request: PersonalModelRequest,
    current_user=Depends(get_current_active_user),
):
    try:
        result = predict_personal_model(
            request.features
        )

        return PersonalModelResponse(
            **result
        )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Personal model error: {str(e)}",
        )