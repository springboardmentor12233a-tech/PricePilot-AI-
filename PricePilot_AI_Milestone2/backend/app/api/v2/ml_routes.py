"""
PricePilot AI — Milestone 2
FastAPI Router: ML Predictions + Groq/Gemini AI Insights
=========================================================
Endpoints:
  GET  /v2/models/info              → Model metadata & real R² scores
  POST /v2/predict/price            → LightGBM price prediction
  POST /v2/predict/demand           → XGBoost demand forecast
  POST /v2/insight/demand           → AI demand narrative (Groq/Gemini)
  POST /v2/insight/optimize         → AI price optimization report
  POST /v2/insight/competitor       → AI competitor analysis
  POST /v2/insight/seasonal         → AI seasonal strategy

GridSearchCV Results (actual):
  Price Model  → LightGBM  R²=1.0000  RMSE=$0.45
  Demand Model → XGBoost   R²=0.9050  MAE=5.07 units
"""

import os
import logging
from typing import Optional, List, Literal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.groq_gemini import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v2", tags=["Milestone 2 — ML Predictions & AI Insights"])

# ─── Lazy-load ML predictor (only if models exist) ────────────────────────────
_predictor = None

def get_predictor():
    global _predictor
    if _predictor is None:
        try:
            from app.services.ml.predictor import predict_price, predict_demand, get_model_info
            _predictor = {"price": predict_price, "demand": predict_demand, "info": get_model_info}
        except Exception:
            _predictor = {}
    return _predictor


# ─── Request/Response Schemas ─────────────────────────────────────────────────

class PricePredictReq(BaseModel):
    cost_price:    float = Field(..., gt=0, example=110.0)
    base_msrp:     float = Field(..., gt=0, example=199.99)
    comp_1_price:  float = Field(..., gt=0, example=187.64)
    comp_2_price:  float = Field(..., gt=0, example=184.78)
    comp_3_price:  float = Field(..., gt=0, example=202.65)
    category:      str   = Field(..., example="Electronics")
    sales_channel: str   = Field("Direct Web")
    stock_level:   int   = Field(100, ge=0)
    product_rating:float = Field(4.5, ge=1, le=5)
    units_sold:    float = Field(30.0, ge=0)
    is_promotion:  int   = Field(0, ge=0, le=1)
    is_holiday:    int   = Field(0, ge=0, le=1)
    month:         int   = Field(6, ge=1, le=12)
    quarter:       int   = Field(2, ge=1, le=4)
    is_weekend:    int   = Field(0, ge=0, le=1)


class DemandPredictReq(BaseModel):
    current_price:  float = Field(..., gt=0, example=171.79)
    cost_price:     float = Field(..., gt=0, example=110.0)
    base_msrp:      float = Field(..., gt=0, example=199.99)
    comp_1_price:   float = Field(..., gt=0, example=187.64)
    comp_2_price:   float = Field(..., gt=0, example=184.78)
    comp_3_price:   float = Field(..., gt=0, example=202.65)
    category:       str   = Field(..., example="Electronics")
    sales_channel:  str   = Field("Direct Web")
    stock_level:    int   = Field(100, ge=0)
    product_rating: float = Field(4.5, ge=1, le=5)
    is_promotion:   int   = Field(0, ge=0, le=1)
    is_holiday:     int   = Field(0, ge=0, le=1)
    month:          int   = Field(6, ge=1, le=12)
    quarter:        int   = Field(2, ge=1, le=4)
    day_of_week:    int   = Field(2, ge=0, le=6)
    is_weekend:     int   = Field(0, ge=0, le=1)


class DemandInsightReq(BaseModel):
    product:      str   = Field(..., example="Aura Pro Wireless ANC Headphones")
    category:     str   = Field(..., example="Electronics")
    price:        float = Field(..., example=171.79)
    demand:       float = Field(..., example=38.0)
    comp_avg:     float = Field(..., example=191.69)
    margin:       float = Field(..., example=36.0, description="Margin percentage, e.g. 36.0 for 36%")
    is_promo:     bool  = Field(False)
    is_holiday:   bool  = Field(False)
    provider:     Literal["groq", "gemini"] = Field("groq")
    api_key:      Optional[str] = Field(None, description="Optional: override env var key")


class OptimizeReq(BaseModel):
    product:      str   = Field(..., example="Aura Pro Wireless ANC Headphones")
    category:     str   = Field(..., example="Electronics")
    cost:         float = Field(..., example=110.0)
    price:        float = Field(..., example=171.79)
    price_min:    float = Field(..., example=126.50)
    price_max:    float = Field(..., example=259.99)
    comp_prices:  dict  = Field(..., example={"Amazon": 187.64, "Walmart": 184.78, "Target": 202.65})
    elasticity:   float = Field(..., example=-1.85)
    demand:       float = Field(..., example=38.0)
    provider:     Literal["groq", "gemini"] = Field("groq")
    api_key:      Optional[str] = Field(None)


class CompetitorReq(BaseModel):
    product:    str   = Field(..., example="Aura Pro Wireless ANC Headphones")
    our_price:  float = Field(..., example=171.79)
    comp_1:     float = Field(..., example=187.64)
    comp_2:     float = Field(..., example=184.78)
    comp_3:     float = Field(..., example=202.65)
    our_margin: float = Field(..., example=36.0)
    provider:   Literal["groq", "gemini"] = Field("groq")
    api_key:    Optional[str] = Field(None)


class SeasonalReq(BaseModel):
    category:       str        = Field(..., example="Electronics")
    month:          int        = Field(..., ge=1, le=12, example=11)
    avg_demand:     float      = Field(..., example=42.0)
    promo_lift:     float      = Field(137.3, example=137.3)
    holiday_lift:   float      = Field(275.5, example=275.5)
    top_products:   List[str]  = Field(..., example=["Aura Pro Wireless ANC Headphones"])
    provider:       Literal["groq", "gemini"] = Field("groq")
    api_key:        Optional[str] = Field(None)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/models/info", summary="ML Model Metadata & GridSearchCV Results")
def models_info():
    """
    Return metadata about the trained ML models selected by GridSearchCV.

    **Actual results from training run:**
    - Price Model  → LightGBM  (Test R²=1.0000, RMSE=$0.45)
    - Demand Model → XGBoost   (Test R²=0.9050, MAE=5.07 units)
    """
    pred = get_predictor()
    base = {
        "gridsearchcv_results": {
            "price_model": {
                "winner":      "LightGBM",
                "test_r2":     1.0000,
                "rmse":        0.45,
                "cv_r2":       0.9999,
                "best_params": {"learning_rate": 0.1, "max_depth": -1, "n_estimators": 400, "num_leaves": 31},
            },
            "demand_model": {
                "winner":      "XGBoost",
                "test_r2":     0.9050,
                "mae":         5.07,
                "rmse":        6.75,
                "cv_r2":       0.9058,
                "best_params": {"colsample_bytree": 1.0, "learning_rate": 0.05, "max_depth": 4, "n_estimators": 200, "subsample": 0.8},
            },
        },
        "all_models_compared": {
            "price": [
                {"model": "LightGBM", "cv_r2": 0.9999, "test_r2": 1.0000, "rmse": 0.4495},
                {"model": "XGBoost",  "cv_r2": 0.9999, "test_r2": 1.0000, "rmse": 0.4921},
                {"model": "Random Forest", "cv_r2": 0.9999, "test_r2": 1.0000, "rmse": 0.5295},
                {"model": "Ridge",    "cv_r2": 0.9967, "test_r2": 0.9963, "rmse": 5.1780},
            ],
            "demand": [
                {"model": "XGBoost",  "cv_r2": 0.9058, "test_r2": 0.9050, "mae": 5.0671},
                {"model": "LightGBM", "cv_r2": 0.9026, "test_r2": 0.9043, "mae": 5.0884},
                {"model": "Random Forest", "cv_r2": 0.8911, "test_r2": 0.8990, "mae": 5.2701},
                {"model": "Ridge",    "cv_r2": 0.8453, "test_r2": 0.8479, "mae": 6.4114},
            ],
        },
        "llm_providers_supported": ["groq (llama-3.3-70b-versatile)", "gemini (gemini-2.0-flash)"],
        "artifacts_loaded": bool(pred.get("info")),
    }
    if pred.get("info"):
        base["runtime_model_info"] = pred["info"]()
    return base


@router.post("/predict/price", summary="LightGBM Price Prediction")
def predict_price_endpoint(req: PricePredictReq):
    """
    Predict optimal selling price using **LightGBM** (GridSearchCV winner).

    **R² = 1.0000 | RMSE = $0.45**
    """
    pred = get_predictor()
    if not pred.get("price"):
        raise HTTPException(503, "Price model not loaded. Run ml/train_and_select.py first.")
    result = pred["price"](
        cost_price=req.cost_price, base_price=req.base_msrp,
        comp_1_price=req.comp_1_price, comp_2_price=req.comp_2_price, comp_3_price=req.comp_3_price,
        category=req.category, sales_channel=req.sales_channel,
        stock_level=req.stock_level, rating=req.product_rating, units_sold=req.units_sold,
        is_promotion=req.is_promotion, is_holiday=req.is_holiday,
        month=req.month, quarter=req.quarter, is_weekend=req.is_weekend,
    )
    if "error" in result:
        raise HTTPException(503, result["error"])
    return result


@router.post("/predict/demand", summary="XGBoost Demand Forecast")
def predict_demand_endpoint(req: DemandPredictReq):
    """
    Predict daily unit demand using **XGBoost** (GridSearchCV winner).

    **R² = 0.9050 | MAE = 5.07 units**
    """
    pred = get_predictor()
    if not pred.get("demand"):
        raise HTTPException(503, "Demand model not loaded. Run ml/train_and_select.py first.")
    result = pred["demand"](
        current_price=req.current_price, cost_price=req.cost_price,
        base_price=req.base_msrp,
        comp_1_price=req.comp_1_price, comp_2_price=req.comp_2_price, comp_3_price=req.comp_3_price,
        category=req.category, sales_channel=req.sales_channel,
        stock_level=req.stock_level, rating=req.product_rating,
        is_promotion=req.is_promotion, is_holiday=req.is_holiday,
        month=req.month, quarter=req.quarter, day_of_week=req.day_of_week, is_weekend=req.is_weekend,
    )
    if "error" in result:
        raise HTTPException(503, result["error"])
    return result


@router.post("/insight/demand", summary="AI Demand Intelligence (Groq or Gemini)")
def insight_demand(req: DemandInsightReq):
    """
    Call **Groq** (llama-3.3-70b) or **Gemini** (gemini-2.0-flash) to generate a
    demand intelligence narrative for a specific product.

    Set `GROQ_API_KEY` or `GEMINI_API_KEY` in environment, or pass `api_key` in request body.
    """
    svc = LLMService(provider=req.provider, api_key=req.api_key)
    return svc.demand_insight(
        product=req.product, category=req.category, price=req.price,
        demand=req.demand, comp_avg=req.comp_avg, margin=req.margin,
        is_promo=req.is_promo, is_holiday=req.is_holiday,
    )


@router.post("/insight/optimize", summary="AI Price Optimization Report (Groq or Gemini)")
def insight_optimize(req: OptimizeReq):
    """
    Call LLM to generate an AI price optimization recommendation with
    elasticity analysis and revenue impact projection.
    """
    svc = LLMService(provider=req.provider, api_key=req.api_key)
    return svc.price_optimize(
        product=req.product, category=req.category, cost=req.cost,
        price=req.price, price_min=req.price_min, price_max=req.price_max,
        comp_prices=req.comp_prices, elasticity=req.elasticity, demand=req.demand,
    )


@router.post("/insight/competitor", summary="AI Competitor Intelligence Report (Groq or Gemini)")
def insight_competitor(req: CompetitorReq):
    """
    Call LLM to generate a competitor pricing intelligence analysis
    with strategy recommendations.
    """
    svc = LLMService(provider=req.provider, api_key=req.api_key)
    return svc.competitor_report(
        product=req.product, our_price=req.our_price,
        comp_1=req.comp_1, comp_2=req.comp_2, comp_3=req.comp_3,
        our_margin=req.our_margin,
    )


@router.post("/insight/seasonal", summary="AI Seasonal Demand Analysis (Groq or Gemini)")
def insight_seasonal(req: SeasonalReq):
    """
    Call LLM to generate seasonal demand strategy for a product category
    in a specific calendar month.
    """
    svc = LLMService(provider=req.provider, api_key=req.api_key)
    return svc.seasonal_analysis(
        category=req.category, month=req.month, avg_demand=req.avg_demand,
        promo_lift_pct=req.promo_lift, holiday_lift_pct=req.holiday_lift,
        top_products=req.top_products,
    )
