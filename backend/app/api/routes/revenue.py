"""
Revenue Optimization API endpoints (PDF Module 6).
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.revenue import ElasticityResponse, RevenueSimulationResponse, PriceOptimizationResponse
from app.services.revenue_optimization import compute_elasticity, simulate_revenue, optimize_price
from app.models.models import Product

router = APIRouter(prefix="/api/revenue", tags=["Revenue Optimization"])


@router.get("/elasticity/{product_id}", response_model=ElasticityResponse)
def get_elasticity(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    result = compute_elasticity(db, product_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Not enough price/quantity history for product {product_id} to estimate elasticity.",
        )

    return ElasticityResponse(product_id=product.id, product_name=product.name, **result)


@router.get("/simulate/{product_id}", response_model=RevenueSimulationResponse)
def get_revenue_simulation(
    product_id: int,
    price_change_pct: float = Query(..., description="Proposed price change, e.g. 10 for +10%, -15 for -15%"),
    db: Session = Depends(get_db),
):
    result = simulate_revenue(db, product_id, price_change_pct)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Cannot simulate revenue for product {product_id} (not found or insufficient history).",
        )
    return result


@router.get("/optimize/{product_id}", response_model=PriceOptimizationResponse)
def get_price_optimization(product_id: int, db: Session = Depends(get_db)):
    result = optimize_price(db, product_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Cannot optimize price for product {product_id} (not found or insufficient history).",
        )
    return result