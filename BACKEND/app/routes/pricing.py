import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user, verify_user_organization
from app.database.database import get_db
from app.models.pricing import PricingRecommendation
from app.models.product import Product
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
    prod = db.query(Product).filter(Product.id == input_data.product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    verify_user_organization(db, current_user, prod.organization_id)
    return predict_optimal_price(db, input_data)


@router.post("/recommendations", response_model=PricingRecommendationResponse, status_code=status.HTTP_201_CREATED)
def add_recommendation(
    rec_in: PricingRecommendationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create and save a pricing recommendation."""
    prod = db.query(Product).filter(Product.id == rec_in.product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    verify_user_organization(db, current_user, prod.organization_id)
    return create_recommendation(db, rec_in)


@router.post("/recommendations/{recommendation_id}/apply", response_model=PricingRecommendationResponse)
def apply_pricing_recommendation(
    recommendation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Apply a pricing recommendation to update actual product price and record history."""
    rec = db.query(PricingRecommendation).filter(PricingRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    prod = db.query(Product).filter(Product.id == rec.product_id).first()
    if prod:
        verify_user_organization(db, current_user, prod.organization_id)
    return apply_recommendation(db, recommendation_id, user_id=current_user.id)


@router.get("/history/{product_id}", response_model=list[PriceHistoryResponse])
def fetch_price_history(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Fetch historical price changes for a product."""
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    verify_user_organization(db, current_user, prod.organization_id)
    return get_price_history(db, product_id)

