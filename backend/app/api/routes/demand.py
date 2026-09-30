"""
PricePilot AI — Demand Route
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas import DemandResponse
from backend.app.services import demand_service

router = APIRouter(tags=["Demand"])


@router.get("/demand", response_model=DemandResponse)
def get_demand_forecast(
    item_id: str = Query(..., description="Unique product SKU identifier"),
    store_id: int = Query(..., description="Store branch identifier (1, 2, 3, or 4)"),
    horizon: int = Query(7, description="Forecast horizon in days (7, 14, or 30)"),
    forecast_origin: Optional[str] = Query(None, description="Forecast origin date in YYYY-MM-DD format"),
) -> DemandResponse:
    """
    Generates autoregressive multi-horizon demand forecasts, trend trajectory classification
    (INCREASING / STABLE / DECREASING), and heuristic confidence score.
    """
    try:
        return demand_service.forecast_demand(
            item_id=item_id,
            store_id=store_id,
            horizon=horizon,
            forecast_origin=forecast_origin,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate demand forecast: {str(e)}")
