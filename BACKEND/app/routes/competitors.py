import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user, verify_user_organization
from app.database.database import get_db
from app.models.competitor import Competitor
from app.models.competitor_product import CompetitorProduct
from app.models.product import Product
from app.schemas.competitor import (
    CompetitorCreate,
    CompetitorPriceCreate,
    CompetitorPriceResponse,
    CompetitorProductCreate,
    CompetitorProductResponse,
    CompetitorResponse,
    CompetitorUpdate,
)
from app.services.competitor_service import (
    create_competitor,
    get_competitor_prices_for_product,
    get_competitors,
    match_competitor_product,
    record_competitor_price,
    update_competitor,
)

router = APIRouter(prefix="/competitors", tags=["Competitors"])


@router.post("/", response_model=CompetitorResponse, status_code=status.HTTP_201_CREATED)
def add_competitor(
    comp_in: CompetitorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Register a competitor."""
    verify_user_organization(db, current_user, comp_in.organization_id)
    return create_competitor(db, comp_in)


@router.get("/organization/{org_id}", response_model=list[CompetitorResponse])
def list_competitors(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """List all competitors registered under an organization."""
    verify_user_organization(db, current_user, org_id)
    return get_competitors(db, org_id)


@router.put("/{competitor_id}", response_model=CompetitorResponse)
def modify_competitor(
    competitor_id: uuid.UUID,
    comp_in: CompetitorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Update competitor details."""
    comp = db.query(Competitor).filter(Competitor.id == competitor_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor not found")
    verify_user_organization(db, current_user, comp.organization_id)
    return update_competitor(db, competitor_id, comp_in)


@router.post("/match", response_model=CompetitorProductResponse, status_code=status.HTTP_201_CREATED)
def match_product(
    comp_prod_in: CompetitorProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Match a competitor product link to an internal product."""
    prod = db.query(Product).filter(Product.id == comp_prod_in.product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internal product not found")
    verify_user_organization(db, current_user, prod.organization_id)
    return match_competitor_product(db, comp_prod_in)


@router.post("/prices", response_model=CompetitorPriceResponse, status_code=status.HTTP_201_CREATED)
def log_competitor_price(
    comp_price_in: CompetitorPriceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Record a scraped or manual competitor price log."""
    comp_prod = db.query(CompetitorProduct).filter(CompetitorProduct.id == comp_price_in.competitor_product_id).first()
    if not comp_prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor product link not found")
    prod = db.query(Product).filter(Product.id == comp_prod.product_id).first()
    if prod:
        verify_user_organization(db, current_user, prod.organization_id)
    return record_competitor_price(db, comp_price_in)


@router.get("/product/{product_id}/prices", response_model=list[CompetitorPriceResponse])
def fetch_competitor_prices(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Fetch competitor price history logs for a specific internal product."""
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    verify_user_organization(db, current_user, prod.organization_id)
    return get_competitor_prices_for_product(db, product_id)
