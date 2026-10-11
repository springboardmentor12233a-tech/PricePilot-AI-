"""
Pricing Analytics Dashboard Module (PDF Module 7) -- business logic.

Unlike other modules, this one doesn't introduce new data or models --
it AGGREGATES what already exists across Sale, Product, CompetitorPrice,
and DemandForecast tables into summary views. This is exactly what a
real "dashboard backend" does: pull numbers from many places, summarize
them, hand back one clean payload the frontend can render as cards/charts.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import Product, Sale, DemandForecast
from app.services.competitor_analysis import detect_pricing_opportunities


def get_revenue_summary(db: Session) -> dict:
    total_revenue = db.query(func.sum(Sale.revenue)).scalar() or 0.0
    total_units = db.query(func.sum(Sale.quantity)).scalar() or 0
    order_count = db.query(func.count(Sale.id)).scalar() or 1  # avoid div-by-zero
    products_tracked = db.query(func.count(func.distinct(Sale.product_id))).scalar() or 0

    return {
        "total_revenue": round(float(total_revenue), 2),
        "total_units_sold": int(total_units),
        "average_order_value": round(float(total_revenue) / order_count, 2),
        "products_tracked": int(products_tracked),
    }


def get_top_products(db: Session, limit: int = 5) -> list[dict]:
    rows = (
        db.query(
            Product.id,
            Product.name,
            func.sum(Sale.revenue).label("total_revenue"),
            func.sum(Sale.quantity).label("total_qty"),
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(Sale.revenue).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "product_id": r.id,
            "product_name": r.name,
            "total_revenue": round(float(r.total_revenue), 2),
            "total_units_sold": int(r.total_qty),
        }
        for r in rows
    ]


def get_pricing_performance(db: Session) -> dict:
    """
    Reuses the Competitor Analysis module's own logic (detect_pricing_opportunities)
    rather than reimplementing the over/underpriced classification --
    keeps ONE source of truth for that business rule instead of two
    copies that could quietly drift out of sync over time.
    """
    total_with_pricing = (
        db.query(func.count(Product.id))
        .filter(Product.source_dataset == "retail_price_optimization")
        .scalar() or 0
    )
    avg_price = (
        db.query(func.avg(Product.current_price))
        .filter(Product.source_dataset == "retail_price_optimization")
        .scalar() or 0.0
    )

    opportunities = detect_pricing_opportunities(db)
    overpriced = sum(1 for o in opportunities if o["opportunity_type"] == "Overpriced")
    underpriced = sum(1 for o in opportunities if o["opportunity_type"] == "Underpriced")
    competitive = total_with_pricing - overpriced - underpriced

    return {
        "total_products_with_pricing": int(total_with_pricing),
        "average_unit_price": round(float(avg_price), 2),
        "products_overpriced": overpriced,
        "products_underpriced": underpriced,
        "products_competitive": max(0, competitive),
    }


def get_forecast_summary(db: Session) -> dict:
    forecasts = db.query(DemandForecast).all()
    if not forecasts:
        return {
            "products_with_forecasts": 0,
            "average_confidence_score": 0.0,
            "increasing_trend_count": 0,
            "stable_trend_count": 0,
            "decreasing_trend_count": 0,
        }

    distinct_products = len({f.product_id for f in forecasts})
    avg_confidence = sum(f.confidence_score for f in forecasts) / len(forecasts)

    return {
        "products_with_forecasts": distinct_products,
        "average_confidence_score": round(avg_confidence, 1),
        "increasing_trend_count": sum(1 for f in forecasts if f.trend == "Increasing"),
        "stable_trend_count": sum(1 for f in forecasts if f.trend == "Stable"),
        "decreasing_trend_count": sum(1 for f in forecasts if f.trend == "Decreasing"),
    }


def get_revenue_by_month(db: Session, limit_months: int = 24) -> list[dict]:
    """
    "Revenue growth over the period" -- groups every Sale row into calendar months.

    Previously used func.to_char(..., 'YYYY-MM') which is PostgreSQL-only and
    raises OperationalError on SQLite (used in tests and local dev without Postgres).
    This version fetches raw (date, revenue) pairs and groups them in Python,
    making the function fully DB-agnostic while producing identical output.

    Capped to the most recent `limit_months` -- Favorita's history alone spans
    2013-2017, so an uncapped chart would be unreadable as a tiny sparkline.
    """
    rows = db.query(Sale.sale_date, Sale.revenue).all()
    monthly: dict[str, float] = {}
    for sale_date, revenue in rows:
        if sale_date is None:
            continue
        key = sale_date.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0.0) + float(revenue or 0)

    sorted_months = sorted(monthly.keys())[-limit_months:]
    return [{"period": k, "revenue": round(monthly[k], 2)} for k in sorted_months]


def get_revenue_by_category(db: Session, limit: int = 8) -> list[dict]:
    """
    Sale doesn't store category directly -- same join-to-Product pattern
    get_top_products already uses above, just grouped by category instead
    of by individual product.
    """
    rows = (
        db.query(Product.category, func.sum(Sale.revenue).label("revenue"))
        .join(Sale, Sale.product_id == Product.id)
        .filter(Product.category.isnot(None))
        .group_by(Product.category)
        .order_by(func.sum(Sale.revenue).desc())
        .limit(limit)
        .all()
    )
    return [{"category": r.category, "revenue": round(float(r.revenue), 2)} for r in rows]


def get_dashboard_overview(db: Session) -> dict:
    return {
        "revenue": get_revenue_summary(db),
        "top_products": get_top_products(db),
        "pricing_performance": get_pricing_performance(db),
        "forecast_summary": get_forecast_summary(db),
        "revenue_by_month": get_revenue_by_month(db),
        "revenue_by_category": get_revenue_by_category(db),
    }