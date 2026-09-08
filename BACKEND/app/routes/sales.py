import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from app.database.database import get_db
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
    return record_sale(db, sale_in)


@router.get("/analytics/{organization_id}", response_model=SalesAnalyticsResponse)
def fetch_sales_analytics(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Fetch aggregated sales analytics for an organization."""
    return get_sales_analytics(db, organization_id)
