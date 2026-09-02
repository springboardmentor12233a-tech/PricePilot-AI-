from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.product import Product
from app.models.pricing import PriceHistory
from app.models.competitor import CompetitorPrice
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductDetailResponse
from app.schemas.pricing import PriceUpdateRequest, PriceHistoryResponse
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/products", tags=["Product Catalog & Pricing Management"])

@router.get("", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if category and category.lower() != "all":
        query = query.filter(Product.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)) | (Product.sub_category.ilike(s)))
    
    products = query.offset(skip).limit(limit).all()
    results = []
    for p in products:
        margin = round(((p.current_price - p.cost_price) / p.current_price) * 100, 1) if p.current_price > 0 else 0
        comp_prices = [c.competitor_price for c in p.competitor_prices]
        comp_avg = round(sum(comp_prices) / len(comp_prices), 2) if comp_prices else p.current_price
        
        item = ProductResponse.model_validate(p)
        item.margin_pct = margin
        item.competitor_avg = comp_avg
        results.append(item)
    return results

@router.get("/categories")
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cats = db.query(Product.category).distinct().all()
    return [c[0] for c in cats if c[0]]

@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    margin = round(((product.current_price - product.cost_price) / product.current_price) * 100, 1) if product.current_price > 0 else 0
    comp_prices = [c.competitor_price for c in product.competitor_prices]
    comp_avg = round(sum(comp_prices) / len(comp_prices), 2) if comp_prices else product.current_price
    
    detail = ProductDetailResponse.model_validate(product)
    detail.margin_pct = margin
    detail.competitor_avg = comp_avg
    return detail

@router.post("", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["pricing_manager", "admin"]))
):
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product_in.sku}' already exists")
    
    if product_in.min_price > product_in.max_price:
        raise HTTPException(status_code=400, detail="Minimum price cannot exceed maximum price guardrail")
    
    if product_in.current_price < product_in.cost_price:
        raise HTTPException(status_code=400, detail="Current price cannot be below cost price (negative margin)")

    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initial price history record
    initial_history = PriceHistory(
        product_id=product.id,
        old_price=product.base_price,
        new_price=product.current_price,
        change_reason="Product Created",
        changed_by=current_user.username
    )
    db.add(initial_history)
    db.commit()

    return ProductResponse.model_validate(product)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    update_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["pricing_manager", "admin"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = update_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)

@router.post("/{product_id}/price", response_model=ProductResponse)
def update_product_price(
    product_id: int,
    price_req: PriceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["pricing_manager", "admin"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_price = round(price_req.new_price, 2)
    old_price = product.current_price

    # Guardrail 1: Bounds check
    if new_price < product.min_price:
        raise HTTPException(
            status_code=400,
            detail=f"Price violation: ${new_price:.2f} is below allowed minimum guardrail (${product.min_price:.2f})"
        )
    if new_price > product.max_price:
        raise HTTPException(
            status_code=400,
            detail=f"Price violation: ${new_price:.2f} exceeds allowed maximum guardrail (${product.max_price:.2f})"
        )

    # Guardrail 2: Cost preservation check
    if new_price < product.cost_price:
        raise HTTPException(
            status_code=400,
            detail=f"Margin violation: Price ${new_price:.2f} is lower than product unit cost ${product.cost_price:.2f}"
        )

    # Log to PriceHistory audit trail
    history_entry = PriceHistory(
        product_id=product.id,
        old_price=old_price,
        new_price=new_price,
        change_reason=price_req.change_reason,
        changed_by=current_user.username
    )
    db.add(history_entry)

    product.current_price = new_price
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)

    res = ProductResponse.model_validate(product)
    res.margin_pct = round(((product.current_price - product.cost_price) / product.current_price) * 100, 1)
    return res

@router.get("/{product_id}/history", response_model=List[PriceHistoryResponse])
def get_price_history(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(PriceHistory).filter(PriceHistory.product_id == product_id).order_by(desc(PriceHistory.created_at)).all()
    return history
