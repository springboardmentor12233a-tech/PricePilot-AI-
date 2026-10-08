"""
AI Insights & LLM Recommendation Proxy Router.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from app.models import (
    ProductInsightResponse,
    ChatQueryRequest,
    ChatQueryResponse,
    User,
)
from app.services.llm import generate_product_insight, answer_chat_query
from app.services.data_loader import get_all_products
from app.services.auth import require_role

router = APIRouter(prefix="/api/insight", tags=["AI Insights & LLM Proxy"])


@router.get("", response_model=List[Dict[str, Any]])
def list_insights(
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns baseline LLM summaries for all products.
    Preserves backward compatibility with Milestone 1 endpoint.
    """
    products = get_all_products()
    return [
        {
            "product_id": p["id"],
            "product_name": p["name"],
            "llm_summary": p.get("llm_summary", ""),
            "confidence_score": p.get("confidence_score", 0.8),
            "demand_trend": p.get("demand_trend", "Stable")
        }
        for p in products
    ]


@router.get("/product/{product_id}", response_model=ProductInsightResponse)
async def get_structured_product_insight(
    product_id: str,
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Generates structured AI pricing recommendation:
    { action: "reduce price"|"increase price"|"hold"|"investigate", reasoning, urgency, expected_impact }
    via live Groq API call with deterministic econometric fallback.
    """
    insight = await generate_product_insight(product_id)
    if not insight:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")
    return insight


@router.post("/chat", response_model=ChatQueryResponse)
async def chat_with_pilot(
    payload: ChatQueryRequest,
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Hybrid conversational AI assistant:
    Answers factual price/kpi/segment questions instantly via local rule engine,
    and forwards open-ended strategic questions to Groq LLM grounded in real portfolio data.
    """
    return await answer_chat_query(payload.question, payload.context_product_id)
