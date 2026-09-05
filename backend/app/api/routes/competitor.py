"""
Competitor Analysis API endpoints (PDF Module 5).
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.competitor import CompetitorComparisonResponse, PricingOpportunity
from app.services.competitor_analysis import get_competitor_comparison, detect_pricing_opportunities

router = APIRouter(prefix="/api/competitor", tags=["Competitor Analysis"])


@router.get("/opportunities", response_model=list[PricingOpportunity])
def list_pricing_opportunities(db: Session = Depends(get_db)):
    """
    Every product where our price meaningfully diverges from the
    competitor average -- sorted by biggest gap first.
    """
    return detect_pricing_opportunities(db)


@router.get("/{product_id}", response_model=CompetitorComparisonResponse)
def get_comparison(product_id: int, db: Session = Depends(get_db)):
    result = get_competitor_comparison(db, product_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No competitor comparison available for product {product_id} "
                   "(product not found, or missing price/competitor data).",
        )
    return result