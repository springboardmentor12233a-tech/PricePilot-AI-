"""
PricePilot AI — Competitor / Market Analysis Route
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas import CompetitorResponse
from backend.app.services import competitor_service

router = APIRouter(tags=["Competitor & Market Analysis"])


@router.get("/competitor", response_model=CompetitorResponse)
def get_competitor_market_analysis(
    item_id: str = Query(..., description="Unique product SKU identifier"),
    store_id: int = Query(..., description="Store branch identifier (1, 2, 3, or 4)"),
    date: Optional[str] = Query(None, description="Observation reference date in YYYY-MM-DD format"),
) -> CompetitorResponse:
    """
    Evaluates physical store price against internal digital-channel benchmark (online.csv),
    cross-store price dispersion, category peer distributions, rule-based market position,
    and advisory pricing opportunity signals.
    """
    try:
        return competitor_service.get_market_analysis(
            item_id=item_id,
            store_id=store_id,
            date=date,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate competitor/market analysis: {str(e)}")
