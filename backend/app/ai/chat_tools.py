"""
Backend "tools" the chatbot is allowed to call. The LLM never queries the
database directly and never generates SQL -- it can only ask for one of
these pre-defined, parameterised functions, each of which returns real
numbers computed by analytics_service / the ML modules.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.services import analytics_service
from app.ml.price_prediction.predict_price import optimize_price
from app.ml.demand_forecasting.forecast_demand import forecast_product_demand


def get_product_kpis(db: Session, product_id: str) -> dict:
    return analytics_service.get_kpis(db, product_id=product_id)


def get_product_price(db: Session, product_id: str) -> dict:
    from app.models.models import Product
    p = db.get(Product, product_id)
    if not p:
        return {"error": "product not found"}
    return {
        "product_id": p.product_id, "product_name": p.product_name,
        "base_price": p.base_price, "cost_price": p.cost_price,
    }


def get_product_forecast(db: Session, product_id: str, horizon_days: int = 30) -> dict:
    return forecast_product_demand(product_id, horizon_days)


def get_pricing_recommendation(db: Session, product_id: str, objective: str = "revenue") -> dict:
    return optimize_price(product_id, objective)


def get_competitor_prices(db: Session, product_id: str) -> list[dict]:
    return analytics_service.get_competitor_analysis(db, product_id=product_id)


def get_top_products(db: Session, n: int = 5) -> list[dict]:
    return analytics_service.get_top_products(db, n=n)


def get_worst_products(db: Session, n: int = 5) -> list[dict]:
    return analytics_service.get_top_products(db, n=n, ascending=True)


def get_revenue_trends(db: Session) -> list[dict]:
    return analytics_service.get_trends(db, metric="revenue")[-30:]


def get_demand_trends(db: Session) -> list[dict]:
    return analytics_service.get_trends(db, metric="demand")[-30:]


def get_stockout_risks(db: Session) -> list[dict]:
    return analytics_service.get_stockout_risks(db)


def get_category_breakdown(db: Session) -> list[dict]:
    return analytics_service.get_breakdown(db, by="category")
