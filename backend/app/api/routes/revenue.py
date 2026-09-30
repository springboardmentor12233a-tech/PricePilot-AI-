"""
PricePilot AI — Revenue Route
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas import RevenueResponse
from backend.app.services import revenue_service

router = APIRouter(tags=["Revenue"])


@router.get("/revenue", response_model=RevenueResponse)
def get_revenue_optimization(
    item_id: str = Query(..., description="Unique product SKU identifier"),
    store_id: int = Query(..., description="Store branch identifier (1, 2, 3, or 4)"),
    date: Optional[str] = Query(None, description="Observation reference date in YYYY-MM-DD format"),
    candidate_range_pct: float = Query(0.20, ge=0.05, le=0.50, description="Candidate search grid range"),
    candidate_step_pct: float = Query(0.05, ge=0.01, le=0.10, description="Candidate step increment"),
) -> RevenueResponse:
    """
    Executes model-driven expected revenue optimization by coupling the demand forecasting
    and price clearing models across a discrete candidate grid.
    """
    try:
        return revenue_service.optimize_revenue(
            item_id=item_id,
            store_id=store_id,
            date=date,
            candidate_range_pct=candidate_range_pct,
            candidate_step_pct=candidate_step_pct,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute revenue optimization: {str(e)}")
