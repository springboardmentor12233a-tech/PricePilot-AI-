import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.competitor import Competitor
from app.models.competitor_price import CompetitorPrice
from app.models.competitor_product import CompetitorProduct
from app.schemas.competitor import (
    CompetitorCreate,
    CompetitorPriceCreate,
    CompetitorProductCreate,
    CompetitorUpdate,
)


def create_competitor(db: Session, comp_in: CompetitorCreate) -> Competitor:
    """Create competitor."""
    competitor = Competitor(
        organization_id=comp_in.organization_id,
        name=comp_in.name,
        website=comp_in.website,
    )
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    return competitor


def get_competitors(db: Session, organization_id: uuid.UUID) -> list[Competitor]:
    """Get all competitors for an organization."""
    return db.query(Competitor).filter(Competitor.organization_id == organization_id).all()


def update_competitor(db: Session, competitor_id: uuid.UUID, comp_in: CompetitorUpdate) -> Competitor:
    """Update competitor details."""
    competitor = db.query(Competitor).filter(Competitor.id == competitor_id).first()
    if not competitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competitor not found",
        )
    update_data = comp_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(competitor, field, value)

    db.commit()
    db.refresh(competitor)
    return competitor


def match_competitor_product(db: Session, comp_prod_in: CompetitorProductCreate) -> CompetitorProduct:
    """Match competitor product with an internal product."""
    competitor_product = CompetitorProduct(
        competitor_id=comp_prod_in.competitor_id,
        product_id=comp_prod_in.product_id,
        name=comp_prod_in.name,
        url=comp_prod_in.url,
        sku=comp_prod_in.sku,
        match_confidence=comp_prod_in.match_confidence,
    )
    db.add(competitor_product)
    db.commit()
    db.refresh(competitor_product)
    return competitor_product


def record_competitor_price(db: Session, comp_price_in: CompetitorPriceCreate) -> CompetitorPrice:
    """Record a newly scraped or manually ingested competitor price."""
    comp_product = db.query(CompetitorProduct).filter(CompetitorProduct.id == comp_price_in.competitor_product_id).first()
    if not comp_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competitor product match not found",
        )

    price_record = CompetitorPrice(
        competitor_product_id=comp_price_in.competitor_product_id,
        price=comp_price_in.price,
        currency=comp_price_in.currency,
        availability=comp_price_in.availability,
    )
    db.add(price_record)
    db.commit()
    db.refresh(price_record)
    return price_record


def get_competitor_prices_for_product(db: Session, product_id: uuid.UUID) -> list[CompetitorPrice]:
    """Retrieve all competitor prices for a specific product."""
    matched_products = (
        db.query(CompetitorProduct)
        .filter(CompetitorProduct.product_id == product_id)
        .all()
    )
    comp_prod_ids = [cp.id for cp in matched_products]
    if not comp_prod_ids:
        return []

    return (
        db.query(CompetitorPrice)
        .filter(CompetitorPrice.competitor_product_id.in_(comp_prod_ids))
        .order_by(CompetitorPrice.scraped_at.desc())
        .all()
    )
