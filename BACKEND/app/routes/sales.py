import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user, verify_user_organization
from app.database.database import get_db
from app.models.product import Product
from app.schemas.sales import SalesAnalyticsResponse, SalesRecordCreate, SalesRecordResponse
from app.services.sales_service import get_sales_analytics, record_sale

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("/", response_model=SalesRecordResponse, status_code=status.HTTP_201_CREATED)
def add_sale_record(
    sale_in: SalesRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Record a sale transaction and deduct inventory stock."""
    prod = db.query(Product).filter(Product.id == sale_in.product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    verify_user_organization(db, current_user, prod.organization_id)
    return record_sale(db, sale_in)


@router.get("/analytics/{organization_id}", response_model=SalesAnalyticsResponse)
def fetch_sales_analytics(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Fetch aggregated sales analytics for an organization."""
    verify_user_organization(db, current_user, organization_id)
    return get_sales_analytics(db, organization_id)

