"""
PricePilot AI — Pricing Route
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas import PricingResponse
from backend.app.services import price_service

router = APIRouter(tags=["Pricing"])


@router.get("/pricing", response_model=PricingResponse)
def get_pricing_recommendation(
    item_id: str = Query(..., description="Unique product SKU identifier, e.g. 293375605257 or da17e2d5feda"),
    store_id: int = Query(..., description="Physical store branch identifier, e.g. 1, 2, 3, or 4"),
    date: Optional[str] = Query(None, description="Observation reference date in YYYY-MM-DD format"),
    candidate_range_pct: float = Query(0.20, ge=0.05, le=0.50, description="Candidate grid range percentage around reference price"),
    candidate_step_pct: float = Query(0.05, ge=0.01, le=0.10, description="Candidate grid step size percentage"),
) -> PricingResponse:
    """
    Computes reference price, model-predicted market clearing price, and recommended
    clearing-aligned price for a specific SKU-store observation.
    """
    try:
        return price_service.get_price_recommendation(
            item_id=item_id,
            store_id=store_id,
            date=date,
            candidate_range_pct=candidate_range_pct,
            candidate_step_pct=candidate_step_pct,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate price recommendation: {str(e)}")
