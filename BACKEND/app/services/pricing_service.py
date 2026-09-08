import uuid
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import RecommendationStatus
from app.models.price_history import PriceHistory
from app.models.pricing import PricingRecommendation
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.schemas.pricing import (
    PricingPredictionInput,
    PricingPredictionOutput,
    PricingRecommendationCreate,
)
from app.services.competitor_service import get_competitor_prices_for_product
from app.services.product_service import get_inventory, get_product


def log_price_change(
    db: Session,
    product_id: uuid.UUID,
    old_price: Decimal,
    new_price: Decimal,
    user_id: uuid.UUID | None = None,
    variant_id: uuid.UUID | None = None,
    reason: str | None = None,
) -> PriceHistory:
    """Log a price change event into price history."""
    history = PriceHistory(
        product_id=product_id,
        variant_id=variant_id,
        old_price=old_price,
        new_price=new_price,
        change_reason=reason,
        changed_by_user_id=user_id,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


def get_price_history(db: Session, product_id: uuid.UUID) -> list[PriceHistory]:
    """Retrieve historical price changes for a product."""
    return (
        db.query(PriceHistory)
        .filter(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.created_at.desc())
        .all()
    )


def predict_optimal_price(db: Session, input_data: PricingPredictionInput) -> PricingPredictionOutput:
    """
    AI / Rule-based dynamic pricing algorithm.
    Calculates recommended price based on cost margin, competitor prices, and inventory levels.
    """
    product = get_product(db, input_data.product_id)
    current_price = product.base_price
    cost_price = product.cost_price or (current_price * Decimal("0.70"))

    if input_data.variant_id:
        variant = db.query(ProductVariant).filter(ProductVariant.id == input_data.variant_id).first()
        if variant and variant.price:
            current_price = variant.price
        if variant and variant.cost_price:
            cost_price = variant.cost_price

    # 1. Competitor Average Price
    comp_prices = get_competitor_prices_for_product(db, input_data.product_id)
    comp_avg: Decimal | None = None
    if comp_prices:
        valid_prices = [p.price for p in comp_prices if p.availability]
        if valid_prices:
            comp_avg = Decimal(str(sum(valid_prices) / len(valid_prices)))

    # 2. Minimum margin floor
    margin_percent = Decimal(str(input_data.target_margin_percent or 20.0)) / Decimal("100")
    min_margin_price = cost_price * (Decimal("1.0") + margin_percent)

    # 3. Inventory Stock Level Adjustment
    try:
        inv = get_inventory(db, input_data.product_id, input_data.variant_id)
        stock_qty = inv.available_quantity
        reorder_lvl = inv.reorder_level
    except Exception:
        stock_qty = 10
        reorder_lvl = 5

    demand_factor = "stable"
    multiplier = Decimal("1.0")

    if stock_qty <= reorder_lvl:
        demand_factor = "increasing"
        multiplier += Decimal("0.05")  # Low stock -> premium pricing (+5%)
    elif stock_qty > 50:
        demand_factor = "decreasing"
        multiplier -= Decimal("0.03")  # High stock -> clearance discount (-3%)

    # Calculate target base
    if comp_avg and comp_avg > min_margin_price:
        # Undercut competitor by 2% to capture market share
        recommended_price = comp_avg * Decimal("0.98") * multiplier
        reason = f"Competitor undercut strategy (2% below avg competitor price {comp_avg:.2f})"
    else:
        recommended_price = min_margin_price * multiplier
        reason = f"Cost-plus margin strategy ({input_data.target_margin_percent}% target margin)"

    # Ensure recommended price never drops below cost + 5%
    floor_price = cost_price * Decimal("1.05")
    if recommended_price < floor_price:
        recommended_price = floor_price
        reason += " [Adjusted to maintain minimum 5% profit margin floor]"

    recommended_price = Decimal(str(round(recommended_price, 2)))

    # Calculate change percentage
    if current_price > 0:
        pct_change = float(((recommended_price - current_price) / current_price) * Decimal("100"))
    else:
        pct_change = 0.0

    return PricingPredictionOutput(
        product_id=input_data.product_id,
        variant_id=input_data.variant_id,
        current_price=current_price,
        recommended_price=recommended_price,
        competitor_avg_price=comp_avg,
        demand_factor=demand_factor,
        recommendation_reason=reason,
        price_change_percentage=round(pct_change, 2),
    )


def create_recommendation(
    db: Session, rec_in: PricingRecommendationCreate
) -> PricingRecommendation:
    """Save a pricing recommendation record."""
    rec = PricingRecommendation(
        product_id=rec_in.product_id,
        variant_id=rec_in.variant_id,
        current_price=rec_in.current_price,
        recommended_price=rec_in.recommended_price,
        competitor_avg_price=rec_in.competitor_avg_price,
        demand_factor=rec_in.demand_factor,
        recommendation_reason=rec_in.recommendation_reason,
        status=RecommendationStatus.PENDING,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def apply_recommendation(
    db: Session, recommendation_id: uuid.UUID, user_id: uuid.UUID | None = None
) -> PricingRecommendation:
    """Apply a pending pricing recommendation to update actual product price."""
    rec = db.query(PricingRecommendation).filter(PricingRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )
    if rec.status != RecommendationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recommendation is already in status '{rec.status}'",
        )

    # Update Product or Variant Price
    old_price = rec.current_price
    new_price = rec.recommended_price

    if rec.variant_id:
        variant = db.query(ProductVariant).filter(ProductVariant.id == rec.variant_id).first()
        if variant:
            variant.price = new_price
    else:
        product = get_product(db, rec.product_id)
        product.base_price = new_price

    # Mark recommendation accepted
    rec.status = RecommendationStatus.ACCEPTED

    # Log price history
    log_price_change(
        db,
        product_id=rec.product_id,
        old_price=old_price,
        new_price=new_price,
        user_id=user_id,
        variant_id=rec.variant_id,
        reason=f"Applied AI Recommendation: {rec.recommendation_reason}",
    )

    db.commit()
    db.refresh(rec)
    return rec
