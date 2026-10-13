from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import CompetitorPrice, CustomerActivity, DailyOperation, Product, User
from app.ml.demand_forecasting.forecast_demand import forecast_product_demand
from app.ml.price_prediction.predict_price import optimize_price
from app.services import analytics_service

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
def list_products(
    search: Optional[str] = None, category: Optional[str] = None,
    sort_by: str = "product_name", page: int = 1, page_size: int = 20,
    db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS)),
):
    q = db.query(Product)
    if search:
        q = q.filter(Product.product_name.ilike(f"%{search}%"))
    if category:
        q = q.filter(Product.category == category)
    total = q.count()
    sort_col = getattr(Product, sort_by, Product.product_name)
    items = q.order_by(sort_col).offset((page - 1) * page_size).limit(page_size).all()

    # attach current price = most recent final_price from daily_operations
    result = []
    for p in items:
        latest_op = (
            db.query(DailyOperation)
            .filter(DailyOperation.product_id == p.product_id)
            .order_by(DailyOperation.date.desc())
            .first()
        )
        result.append({
            "product_id": p.product_id, "product_name": p.product_name, "category": p.category,
            "subcategory": p.subcategory, "brand": p.brand, "cost_price": p.cost_price,
            "base_price": p.base_price, "current_price": latest_op.final_price if latest_op else p.base_price,
            "rating": p.rating, "num_reviews": p.num_reviews, "is_active": p.is_active,
        })
    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/{product_id}")
def product_detail(product_id: str, db: Session = Depends(get_db),
                    _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    kpis = analytics_service.get_kpis(db, product_id=product_id)
    competitor = analytics_service.get_competitor_analysis(db, product_id=product_id)
    price_history = (
        db.query(DailyOperation.date, DailyOperation.final_price, DailyOperation.units_sold)
        .filter(DailyOperation.product_id == product_id)
        .order_by(DailyOperation.date)
        .all()
    )
    customer_events = db.query(CustomerActivity).filter(CustomerActivity.product_id == product_id).count()

    forecast = None
    optimization = None
    try:
        forecast = forecast_product_demand(product_id, horizon_days=30)
    except Exception:
        pass
    try:
        optimization = optimize_price(product_id, objective="revenue")
    except Exception:
        pass

    return {
        "product": {
            "product_id": p.product_id, "product_name": p.product_name, "category": p.category,
            "subcategory": p.subcategory, "brand": p.brand, "cost_price": p.cost_price,
            "base_price": p.base_price, "rating": p.rating, "num_reviews": p.num_reviews,
            "is_active": p.is_active,
        },
        "kpis": kpis,
        "competitor_analysis": competitor,
        "price_history": [{"date": str(d), "final_price": fp, "units_sold": u} for d, fp, u in price_history],
        "customer_event_count": customer_events,
        "forecast_30d": forecast,
        "price_optimization": optimization,
    }
