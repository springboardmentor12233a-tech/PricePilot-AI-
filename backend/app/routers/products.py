"""
Products & Catalog Router.
Full CRUD for Admin, Read-only for Business Analyst.
Includes Pydantic validation and audit logging.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    ProductResponse,
    ProductCreate,
    ProductUpdate,
    User,
)
from app.services.data_loader import (
    get_all_products,
    get_product_by_id,
    create_product,
    update_product,
    delete_product,
)
from app.services.auth import require_role, log_audit

router = APIRouter(prefix="/api/products", tags=["Product Catalog & Management"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name or ID"),
    days: int = Query(30, description="Date filter horizon in days (7, 30, 90)"),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns list of products enriched with dynamic elasticity recommendations and OLS confidence scores.
    Authorized for Admin and Business Analyst roles.
    """
    products = get_all_products(days=days)
    if category and category.lower() != "all":
        products = [p for p in products if p.get("category", "").lower() == category.lower()]
    if search:
        s = search.lower().strip()
        products = [
            p for p in products if s in p.get("name", "").lower() or s in p.get("id", "").lower()
        ]
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    days: int = Query(30, description="Date horizon in days"),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns details for a single product SKU by ID.
    Authorized for Admin and Business Analyst roles.
    """
    product = get_product_by_id(product_id, days=days)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_new_product(
    payload: ProductCreate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Create a new product in the portfolio with econometric validation.
    """
    new_prod = create_product(payload.model_dump())
    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="PRODUCT_CREATED",
        details=f"Admin created SKU '{new_prod['name']}' ({new_prod['id']}) at ${new_prod['current_price']}",
        request=request,
    )
    return new_prod


@router.put("/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: str,
    payload: ProductUpdate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Update an existing product's price, competitor benchmark, or inventory.
    """
    updated = update_product(product_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")

    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="PRODUCT_UPDATED",
        details=f"Admin updated SKU '{updated['name']}' ({product_id})",
        request=request,
    )
    return updated


@router.delete("/{product_id}")
def delete_existing_product(
    product_id: str,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Remove a product SKU from the catalog.
    Business Analyst will receive 403 Forbidden.
    """
    success = delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")

    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="PRODUCT_DELETED",
        details=f"Admin deleted SKU '{product_id}'",
        request=request,
    )
    return {"message": f"Product '{product_id}' successfully removed from portfolio."}
