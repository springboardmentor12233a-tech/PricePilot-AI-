from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional

from app.db.session import get_db
from app.models.product import Product
from app.models.pricing import PriceHistory
from app.models.sales import SalesRecord
from app.models.user import User
from app.schemas.analytics import KPIOverview, RevenueTrendPoint, CategoryBreakdown, RecentPriceActivity
from app.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Revenue Intelligence & Pricing Dashboards"])

@router.get("/kpis", response_model=KPIOverview)
def get_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_products = db.query(Product).count()
    active_skus = db.query(Product).filter(Product.stock_level > 0).count()
    
    sales_agg = db.query(
        func.sum(SalesRecord.revenue).label("total_rev"),
        func.sum(SalesRecord.units_sold).label("total_units"),
        func.sum(SalesRecord.gross_profit).label("total_profit")
    ).first()

    total_revenue = round(sales_agg.total_rev or 0.0, 2)
    total_units_sold = int(sales_agg.total_units or 0)
    total_gross_profit = round(sales_agg.total_profit or 0.0, 2)
    
    avg_profit_margin_pct = round((total_gross_profit / total_revenue * 100), 2) if total_revenue > 0 else 0.0
    recent_price_changes_count = db.query(PriceHistory).count()

    return KPIOverview(
        total_products=total_products,
        active_skus=active_skus,
        total_revenue=total_revenue,
        total_units_sold=total_units_sold,
        total_gross_profit=total_gross_profit,
        avg_profit_margin_pct=avg_profit_margin_pct,
        recent_price_changes_count=recent_price_changes_count
    )

@router.get("/revenue-trend", response_model=List[RevenueTrendPoint])
def get_revenue_trend(
    timeframe: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    limit_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = limit_map.get(timeframe, 30)

    rows = db.query(
        SalesRecord.recorded_date,
        func.sum(SalesRecord.revenue).label("rev"),
        func.sum(SalesRecord.units_sold).label("units"),
        func.sum(SalesRecord.gross_profit).label("profit")
    ).group_by(SalesRecord.recorded_date).order_by(desc(SalesRecord.recorded_date)).limit(days).all()

    # Reverse to return chronological order
    rows = list(reversed(rows))
    return [
        RevenueTrendPoint(
            date=r.recorded_date,
            revenue=round(r.rev, 2),
            units_sold=int(r.units),
            gross_profit=round(r.profit, 2)
        )
        for r in rows
    ]

@router.get("/category-breakdown", response_model=List[CategoryBreakdown])
def get_category_breakdown(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(
        Product.category,
        func.sum(SalesRecord.revenue).label("rev"),
        func.sum(SalesRecord.units_sold).label("units"),
        func.sum(SalesRecord.gross_profit).label("profit"),
        func.count(func.distinct(Product.id)).label("prod_count")
    ).join(SalesRecord, Product.id == SalesRecord.product_id).group_by(Product.category).all()

    results = []
    for r in rows:
        rev = round(r.rev or 0.0, 2)
        profit = round(r.profit or 0.0, 2)
        margin = round((profit / rev * 100), 1) if rev > 0 else 0.0
        results.append(CategoryBreakdown(
            category=r.category,
            revenue=rev,
            units_sold=int(r.units or 0),
            gross_profit=profit,
            margin_pct=margin,
            product_count=int(r.prod_count or 0)
        ))
    return results

@router.get("/recent-price-changes", response_model=List[RecentPriceActivity])
def get_recent_price_changes(limit: int = 15, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(
        PriceHistory.id,
        PriceHistory.product_id,
        Product.name.label("product_name"),
        Product.category,
        PriceHistory.old_price,
        PriceHistory.new_price,
        PriceHistory.change_reason,
        PriceHistory.changed_by,
        PriceHistory.created_at
    ).join(Product, PriceHistory.product_id == Product.id).order_by(desc(PriceHistory.created_at)).limit(limit).all()

    return [
        RecentPriceActivity(
            id=r.id,
            product_id=r.product_id,
            product_name=r.product_name,
            category=r.category,
            old_price=r.old_price,
            new_price=r.new_price,
            price_diff=round(r.new_price - r.old_price, 2),
            change_reason=r.change_reason,
            changed_by=r.changed_by,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        )
        for r in rows
    ]
