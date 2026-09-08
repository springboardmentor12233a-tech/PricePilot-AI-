import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from app.database.database import get_db
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services.product_service import create_category, get_categories

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create a new product category."""
    return create_category(db, cat_in)


@router.get("/organization/{org_id}", response_model=list[CategoryResponse])
def list_org_categories(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """List all categories for an organization."""
    return get_categories(db, org_id)
