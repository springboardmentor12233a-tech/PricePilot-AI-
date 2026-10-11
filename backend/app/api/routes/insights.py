"""
AI Pricing Insights API endpoint (mentor requirement #3).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.insights import PricingInsightResponse
from app.services.llm_insights import generate_pricing_insight
from app.api.routes.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/insights", tags=["AI Pricing Insights"])


@router.get("/{product_id}", response_model=PricingInsightResponse)
def get_pricing_insight(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = generate_pricing_insight(db, product_id)
    except RuntimeError as e:
        # Missing API key, Groq rate limit, network failure, etc. -- a
        # dependency problem, not a bad request, so 503 (not 500 or 400).
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return result