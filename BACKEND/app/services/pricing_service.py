import uuid
from decimal import Decimal, ROUND_CEILING, ROUND_HALF_UP
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


def _matching_variant(
    db: Session, product_id: uuid.UUID, variant_id: uuid.UUID
) -> ProductVariant:
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant or variant.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product variant not found",
        )
    return variant



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


def predict_optimal_price(
    db: Session, input_data: PricingPredictionInput
) -> PricingPredictionOutput:
    """Calculate a recommendation from cost, competitors, and inventory."""
    product = get_product(db, input_data.product_id)
    current_price = product.base_price
    cost_price = product.cost_price

    if input_data.variant_id:
        variant = _matching_variant(db, input_data.product_id, input_data.variant_id)
        if variant.price is not None:
            current_price = variant.price
        if variant.cost_price is not None:
            cost_price = variant.cost_price

    if cost_price is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A cost price is required for pricing recommendations.",
        )
    if not current_price.is_finite() or current_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid positive current price is required for pricing recommendations.",
        )
    if not cost_price.is_finite() or cost_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid positive cost price is required for pricing recommendations.",
        )

    currency = (product.currency or "INR").upper()
    competitor_prices = get_competitor_prices_for_product(db, input_data.product_id)
    compatible_prices = [
        item
        for item in competitor_prices
        if item.availability
        and item.price.is_finite()
        and item.price > 0
        and (item.currency or "").upper() == currency
    ]
    competitor_avg = (
        sum((item.price for item in compatible_prices), Decimal("0"))
        / Decimal(len(compatible_prices))
        if compatible_prices
        else None
    )

    margin_percent = (
        20.0
        if input_data.target_margin_percent is None
        else input_data.target_margin_percent
    )
    minimum_price = cost_price * (
        Decimal("1") + Decimal(str(margin_percent)) / Decimal("100")
    )

    try:
        inventory = get_inventory(db, input_data.product_id, input_data.variant_id)
        stock_qty = inventory.available_quantity
        reorder_level = inventory.reorder_level
    except HTTPException as exc:
        if exc.status_code != status.HTTP_404_NOT_FOUND:
            raise
        stock_qty = None
        reorder_level = None

    demand_factor = None
    multiplier = Decimal("1")

    if stock_qty is not None and stock_qty <= reorder_level:
        demand_factor = "increasing"
        multiplier += Decimal("0.05")
    elif stock_qty is not None and stock_qty > 50:
        demand_factor = "decreasing"
        multiplier -= Decimal("0.03")
    elif stock_qty is not None:
        demand_factor = "stable"

    if competitor_avg is not None and competitor_avg > minimum_price:
        recommended_price = competitor_avg * Decimal("0.98") * multiplier
        reason = (
            "Competitor undercut strategy (2% below average competitor price {})"
            .format(format(competitor_avg, ".2f"))
        )
    else:
        recommended_price = minimum_price * multiplier
        reason = "Cost-plus margin strategy ({}% target margin)".format(margin_percent)

    floor_price = (cost_price * Decimal("1.05")).quantize(
        Decimal("0.01"), rounding=ROUND_CEILING
    )
    if recommended_price < floor_price:
        recommended_price = floor_price
        reason += " [Adjusted to maintain minimum 5% profit margin floor]"

    recommended_price = recommended_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if recommended_price < floor_price:
        recommended_price = floor_price
    if not recommended_price.is_finite() or recommended_price <= 0 or recommended_price > Decimal("9999999999.99"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The calculated price is outside the supported product price range.",
        )
    pct_change = (
        float(((recommended_price - current_price) / current_price) * Decimal("100"))
        if current_price > 0
        else 0.0
    )

    return PricingPredictionOutput(
        product_id=input_data.product_id,
        variant_id=input_data.variant_id,
        current_price=current_price,
        recommended_price=recommended_price,
        competitor_avg_price=competitor_avg,
        demand_factor=demand_factor,
        recommendation_reason=reason,
        price_change_percentage=round(pct_change, 2),
    )



def create_recommendation(
    db: Session, rec_in: PricingRecommendationCreate
) -> PricingRecommendation:
    """Save a pricing recommendation record."""
    product = get_product(db, rec_in.product_id)
    current_price = product.base_price
    cost_price = product.cost_price
    if rec_in.variant_id:
        variant = _matching_variant(db, rec_in.product_id, rec_in.variant_id)
        current_price = variant.price if variant.price is not None else current_price
        cost_price = variant.cost_price if variant.cost_price is not None else cost_price

    if current_price is None or rec_in.current_price != current_price:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The product price changed. Run the pricing analysis again.",
        )
    if cost_price is None or not cost_price.is_finite() or cost_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid positive cost price is required for recommendations.",
        )
    minimum_price = (cost_price * Decimal("1.05")).quantize(
        Decimal("0.01"), rounding=ROUND_CEILING
    )
    if rec_in.recommended_price < minimum_price:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The recommended price is below the minimum 5% cost margin floor.",
        )
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

    # Reject stale recommendations instead of overwriting a newer catalog price.
    product = get_product(db, rec.product_id)
    if rec.variant_id:
        variant = _matching_variant(db, rec.product_id, rec.variant_id)
        live_price = variant.price if variant.price is not None else product.base_price
    else:
        live_price = product.base_price
    if live_price != rec.current_price:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The product price changed. Create a new pricing recommendation.",
        )

    # Update Product or Variant Price
    old_price = live_price
    new_price = rec.recommended_price

    if rec.variant_id:
        variant.price = new_price
    else:
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
