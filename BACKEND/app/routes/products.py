import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from app.database.database import get_db
from app.schemas.product import (
    InventoryResponse,
    InventoryUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
)
from app.services.product_service import (
    create_product,
    create_product_variant,
    delete_product,
    get_inventory,
    get_product,
    get_products,
    update_inventory,
    update_product,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create a new product with base inventory."""
    return create_product(db, prod_in)


@router.get("/organization/{org_id}", response_model=list[ProductResponse])
def list_products(
    org_id: uuid.UUID,
    category_id: uuid.UUID | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get all products for an organization."""
    return get_products(db, org_id, category_id, search)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get details of a specific product."""
    return get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def modify_product(
    product_id: uuid.UUID,
    prod_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Update product information."""
    return update_product(db, product_id, prod_in)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Delete a product."""
    delete_product(db, product_id)


@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def add_variant(
    product_id: uuid.UUID,
    variant_in: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Add a variant to a product."""
    return create_product_variant(db, product_id, variant_in)


@router.get("/{product_id}/inventory", response_model=InventoryResponse)
def fetch_inventory(
    product_id: uuid.UUID,
    variant_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Fetch product or variant inventory stock level."""
    return get_inventory(db, product_id, variant_id)


@router.put("/{product_id}/inventory", response_model=InventoryResponse)
def modify_inventory(
    product_id: uuid.UUID,
    inv_in: InventoryUpdate,
    variant_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Update stock quantities and reorder levels."""
    return update_inventory(db, product_id, inv_in, variant_id)
