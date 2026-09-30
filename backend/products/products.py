from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import Product
from backend.auth.dependencies import require_role


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


class ProductCreate(BaseModel):
    product_code: str
    name: str
    price: float
    cost_price: float | None = None
    stock_quantity: int = 0
    category_id: int


@router.post("/")
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    existing_product = (
        db.query(Product)
        .filter(
            Product.product_code == product_data.product_code
        )
        .first()
    )

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="Product code already exists"
        )

    product = Product(
        product_code=product_data.product_code,
        name=product_data.name,
        price=product_data.price,
        cost_price=product_data.cost_price,
        stock_quantity=product_data.stock_quantity,
        category_id=product_data.category_id
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Product created successfully",
        "product": product
    }


@router.get("/")
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    return db.query(Product).all()

@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            "Admin",
            "Business Analyst",
            "User"
        )
    )
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product

class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    cost_price: float | None = None
    stock_quantity: int | None = None
    category_id: int | None = None
    description: str | None = None
    is_active: bool | None = None

@router.put("/{product_id}")
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return {
        "message": "Product updated successfully",
        "product": product
    }
@router.delete("/{product_id}")
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.is_active = False

    db.commit()
    db.refresh(product)

    return {
        "message": "Product deactivated successfully",
        "product_id": product.id
    }
@router.delete("/{product_id}")
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.is_active = False

    db.commit()
    db.refresh(product)

    return {
        "message": "Product deactivated successfully",
        "product_id": product.id
    }