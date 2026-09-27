"""
PricePilot AI — Milestone 3
Price Prediction & Demand Forecasting API endpoints
Role-protected: analysts and admins only
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from ...models.user import User, UserRole
from ...services.auth_service import require_roles
from ...services.prediction_service import (
    PricePredictionInput, DemandForecastInput,
    predict_price, forecast_demand
)

router = APIRouter(prefix="/api/v3", tags=["predictions-v3"])

# Dependency: analyst or admin
_analyst_plus = require_roles(UserRole.admin, UserRole.analyst)


@router.post("/predict/price")
def api_predict_price(
    inp: PricePredictionInput,
    current_user: User = Depends(_analyst_plus)
):
    """
    Predict optimal price for a product using LightGBM model.

    - **Requires:** Analyst or Admin role
    - **Model:** LightGBM (Price R²=1.0000, RMSE=$0.45)
    - **Returns:** predicted price, confidence %, price range, margin

    Example input:
    ```json
    {
      "product_name": "UltraView 4K Monitor",
      "category": "Electronics",
      "cost_price": 137.0,
      "base_msrp": 299.99,
      "competitor_1_price": 265.0,
      "competitor_2_price": 258.0,
      "competitor_3_price": 253.7,
      "discount_pct": 0,
      "is_promotion": false,
      "stock_level": 500,
      "sales_channel": "Direct Web",
      "product_rating": 4.7,
      "month": 11,
      "is_weekend": false
    }
    ```
    """
    try:
        result = predict_price(inp)
        return {"status": "success", "data": result, "requested_by": current_user.email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/demand")
def api_forecast_demand(
    inp: DemandForecastInput,
    current_user: User = Depends(_analyst_plus)
):
    """
    Forecast daily demand with confidence intervals using XGBoost model.

    - **Requires:** Analyst or Admin role
    - **Model:** XGBoost (Demand R²=0.9050, MAE=5.07 units)
    - **Returns:** daily_demand, total_units, revenue, profit, confidence %, day-by-day series

    Confidence score reflects model certainty based on:
    - Stock availability (low stock → lower confidence)
    - Forecast horizon (>90 days → lower confidence)
    - Holiday/promo volatility
    - Market growth stability
    """
    try:
        result = forecast_demand(inp)
        return {"status": "success", "data": result, "requested_by": current_user.email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis/summary")
def api_kpi_summary(current_user: User = Depends(require_roles(UserRole.admin, UserRole.analyst, UserRole.user))):
    """
    Business-wide KPI summary. Accessible by all roles.
    Returns aggregated KPIs from Milestone 2 extraction.
    """
    return {
        "status": "success",
        "data": {
            "total_revenue": 28245979,
            "gross_profit": 13511274,
            "avg_gross_margin_pct": 54.89,
            "total_units_sold": 293345,
            "active_products": 15,
            "avg_price_our": 98.94,
            "avg_price_competitor": 104.26,
            "price_advantage_usd": 5.32,
            "best_category_margin": {"name": "Health & Beauty", "margin_pct": 64.44},
            "top_revenue_category": {"name": "Electronics", "revenue": 10590000},
            "peak_month": {"name": "December", "revenue": 3550000},
            "data_period": "12 months",
            "dataset_rows": 7300,
        },
        "requested_by": current_user.email
    }


@router.get("/kpis/products")
def api_product_kpis(current_user: User = Depends(require_roles(UserRole.admin, UserRole.analyst, UserRole.user))):
    """Product-level KPIs. All roles."""
    products = [
        {"name": "UltraView 4K Monitor", "category": "Electronics", "price": 245.50, "cost": 137.0,
         "comp_avg": 258.90, "margin_pct": 44.2, "daily_demand": 38.2, "annual_rev": 3390000,
         "rating": 4.7, "status": "Optimal"},
        {"name": "Aura Pro Headphones", "category": "Electronics", "price": 187.50, "cost": 110.5,
         "comp_avg": 196.43, "margin_pct": 41.1, "daily_demand": 40.7, "annual_rev": 2790000,
         "rating": 4.6, "status": "Raise Price"},
        {"name": "SmartHome Hub Pro", "category": "Electronics", "price": 132.00, "cost": 63.0,
         "comp_avg": 138.50, "margin_pct": 52.3, "daily_demand": 35.1, "annual_rev": 1690000,
         "rating": 4.5, "status": "Optimal"},
        {"name": "FlexFit Yoga Mat", "category": "Sports & Outdoors", "price": 45.00, "cost": 18.0,
         "comp_avg": 48.90, "margin_pct": 60.0, "daily_demand": 49.8, "annual_rev": 820000,
         "rating": 4.7, "status": "Optimal"},
        {"name": "LuxeDream Mattress", "category": "Home & Kitchen", "price": 189.00, "cost": 84.8,
         "comp_avg": 198.75, "margin_pct": 55.2, "daily_demand": 28.4, "annual_rev": 1960000,
         "rating": 4.8, "status": "Raise Price"},
        {"name": "VitalBoost Vitamins", "category": "Health & Beauty", "price": 38.00, "cost": 12.0,
         "comp_avg": 40.20, "margin_pct": 68.4, "daily_demand": 52.7, "annual_rev": 730000,
         "rating": 4.7, "status": "Optimal"},
    ]
    return {"status": "success", "data": products, "total": len(products)}
