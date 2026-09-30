"""
PricePilot AI — Gemini Business Insights Route
"""

from fastapi import APIRouter, Query
from backend.app.schemas import InsightResponse
from backend.app.services import insight_service

router = APIRouter(tags=["Insights"])


@router.get("/insights", response_model=InsightResponse)
def get_business_insights(
    item_id: str = Query(..., description="Unique product SKU identifier"),
    store_id: int = Query(..., description="Store branch identifier (1, 2, 3, or 4)"),
) -> InsightResponse:
    """
    Generates executive business explanations and strategic merchandising recommendations
    using Google's Gemini GenAI API with guaranteed offline/mock fallback.
    """
    # Safe handler: Never throws 500 error on missing API key or offline status
    return insight_service.generate_insight(item_id=item_id, store_id=store_id)
