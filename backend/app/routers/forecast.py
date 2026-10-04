"""
Demand Forecasting Router.
Protected: Admin and Business Analyst roles.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import ProductForecastResponse, User
from app.services.data_loader import compute_demand_forecast, get_all_products
from app.services.auth import require_role

router = APIRouter(prefix="/api/forecast", tags=["Demand Forecasting"])


@router.get("/all", response_model=List[ProductForecastResponse])
def get_all_forecasts(
    horizon: str = Query("30d", description="Forecast horizon: '7d', '14d', or '30d'"),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns demand forecasting projections and model confidence across all products for chosen horizon.
    """
    h_days = 7 if "7" in horizon else (14 if "14" in horizon else 30)
    products = get_all_products()
    results = []
    for p in products:
        fc = compute_demand_forecast(p["id"], horizon_days=h_days)
        if fc:
            results.append(fc)
    return results


@router.get("/{product_id}", response_model=ProductForecastResponse)
def get_product_forecast(
    product_id: str,
    horizon: str = Query("30d", description="Forecast horizon: '7d', '14d', or '30d'"),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns rolling linear regression demand forecast for a single product with specified horizon.
    Includes historical points, projected periods, prediction intervals,
    and confidence scores tied directly to model R².
    """
    h_days = 7 if "7" in horizon else (14 if "14" in horizon else 30)
    fc = compute_demand_forecast(product_id, horizon_days=h_days)
    if not fc:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")
    return fc
