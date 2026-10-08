"""
Pricing Optimization & Simulation Router.
Protected: Admin and Business Analyst roles.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import (
    PricingSweepResponse,
    OptimizePriceRequest,
    OptimizePriceResponse,
    KPIOverview,
    User,
)
from app.services.data_loader import (
    compute_pricing_sweep,
    simulate_custom_price,
    calculate_kpi_overview,
    get_revenue_history,
)
from app.services.auth import require_role

router = APIRouter(prefix="/api/pricing", tags=["Pricing Intelligence & Optimization"])


@router.get("/summary", response_model=KPIOverview)
def get_pricing_kpi_summary(
    days: int = Query(30, description="Date filter horizon (7, 30, 90 days)"),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns executive KPI metrics across the electronics portfolio:
    total revenue, growth %, units sold, potential revenue lift, and avg model confidence.
    """
    return calculate_kpi_overview(days=days)


@router.get("/history", response_model=List[Dict[str, Any]])
def get_history(
    days: int = Query(30, description="Date filter horizon (7, 30, 90 days)"),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns historical revenue (baseline vs. optimized) and units for requested date window.
    """
    return get_revenue_history(days=days)


@router.post("/optimize", response_model=OptimizePriceResponse)
def simulate_price(
    payload: OptimizePriceRequest,
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Simulates a custom hypothetical price against the elasticity model, returning
    predicted unit demand, projected revenue, and revenue delta vs current.
    """
    result = simulate_custom_price(payload.product_id, payload.custom_price)
    if not result:
        raise HTTPException(status_code=404, detail=f"Product with ID '{payload.product_id}' not found.")
    return result


@router.get("/{product_id}", response_model=PricingSweepResponse)
@router.get("/sweep/{product_id}", response_model=PricingSweepResponse)
def get_pricing_sweep(
    product_id: str,
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns candidate prices along the elasticity curve with predicted demand and revenue.
    Grounded in Dataset 1 econometric elasticity.
    """
    sweep = compute_pricing_sweep(product_id)
    if not sweep:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")
    return sweep
