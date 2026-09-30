"""
PricePilot AI — Conversational AI Chat API Route
=================================================
Provides POST /api/chat endpoint allowing authenticated users across all roles
to query real business metrics, price recommendations, demand forecasts, and alerts.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.auth import get_current_active_user
from backend.app.schemas.requests import ChatRequest, ChatResponse
from backend.app.schemas.auth import UserInfo
from backend.app.services.chat_service import ChatService

log = logging.getLogger("chat_route")

router = APIRouter(tags=["AI Chat Assistant"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask PricePilot AI business assistant",
    description=(
        "Processes natural language retail pricing and demand queries using real project "
        "KPI metrics, ML inference, and Gemini GenAI with deterministic offline fallback."
    ),
)
def ask_chat_assistant(
    request: ChatRequest,
    current_user: UserInfo = Depends(get_current_active_user),
) -> ChatResponse:
    """Handles conversational questions from authenticated users across ADMIN, BUSINESS_ANALYST, and USER."""
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Chat message cannot be empty.",
        )

    user_email = current_user.get("email", "unknown") if isinstance(current_user, dict) else getattr(current_user, "email", "unknown")
    user_role = current_user.get("role", "USER") if isinstance(current_user, dict) else getattr(current_user, "role", "USER")

    log.info(
        "Chat query received from user %s (%s): %s (sku=%s, store_id=%s)",
        user_email,
        user_role,
        request.message[:50],
        request.sku,
        request.store_id,
    )

    chat_service = ChatService()
    response = chat_service.answer_query(
        message=request.message,
        sku=request.sku,
        store_id=request.store_id,
    )
    return response
