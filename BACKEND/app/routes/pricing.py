import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from app.database.database import get_db
from app.schemas.pricing import (
    PriceHistoryResponse,
    PricingPredictionInput,
    PricingPredictionOutput,
    PricingRecommendationCreate,
    PricingRecommendationResponse,
)
from app.services.pricing_service import (
    apply_recommendation,
    create_recommendation,
    get_price_history,
    predict_optimal_price,
)

router = APIRouter(prefix="/pricing", tags=["Pricing Engine"])


@router.post("/predict", response_model=PricingPredictionOutput)
def predict_price(
    input_data: PricingPredictionInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Predict optimal dynamic price for a product using AI/rules engine."""
    return predict_optimal_price(db, input_data)


@router.post("/recommendations", response_model=PricingRecommendationResponse, status_code=status.HTTP_201_CREATED)
def add_recommendation(
    rec_in: PricingRecommendationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create and save a pricing recommendation."""
    return create_recommendation(db, rec_in)


@router.post("/recommendations/{recommendation_id}/apply", response_model=PricingRecommendationResponse)
def apply_pricing_recommendation(
    recommendation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Apply a pricing recommendation to update actual product price and record history."""
    return apply_recommendation(db, recommendation_id, user_id=current_user.id)


@router.get("/history/{product_id}", response_model=list[PriceHistoryResponse])
def fetch_price_history(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Fetch historical price changes for a product."""
    return get_price_history(db, product_id)
