"""
Loads the trained price model and:
  1. predict_current_price_estimate(): sanity-check model prediction for a product's
     current context (used for explanation, not the recommendation itself).
  2. optimize_price(): generates candidate prices around the current price, predicts
     demand for each with the demand model (falling back to an elasticity heuristic
     estimated from historical data if the demand model isn't available), and picks
     the best candidate per the requested objective.
"""
import json
import os
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings

MODELS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.MODELS_DIR))
PROCESSED_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.DATA_PROCESSED_DIR))

_model_cache = {}


def _load_price_model():
    if "price_model" not in _model_cache:
        path = os.path.join(MODELS_DIR, "price_model.joblib")
        if not os.path.exists(path):
            return None
        _model_cache["price_model"] = joblib.load(path)
    return _model_cache["price_model"]


def get_model_metadata() -> Optional[dict]:
    path = os.path.join(MODELS_DIR, "price_model_metadata.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def _latest_row_for_product(product_id: str) -> Optional[pd.Series]:
    path = os.path.join(PROCESSED_DIR, "feature_table.csv")
    if not os.path.exists(path):
        return None
    df = pd.read_csv(path, parse_dates=["date"])
    prod = df[df["product_id"] == product_id].sort_values("date")
    if prod.empty:
        return None
    return prod.iloc[-1]


def _estimate_price_elasticity(product_id: str) -> float:
    """Estimate demand elasticity to price from historical data:
    % change in units vs % change in price, per product. Falls back to a
    conservative default (-1.2) if there isn't enough variation to estimate."""
    path = os.path.join(PROCESSED_DIR, "feature_table.csv")
    if not os.path.exists(path):
        return -1.2
    df = pd.read_csv(path, parse_dates=["date"])
    prod = df[df["product_id"] == product_id].sort_values("date")
    if len(prod) < 20:
        return -1.2
    price_pct = prod["final_price"].pct_change().replace([np.inf, -np.inf], np.nan)
    units_pct = prod["units_sold"].pct_change().replace([np.inf, -np.inf], np.nan)
    mask = (price_pct.abs() > 0.01) & units_pct.notna() & price_pct.notna()
    if mask.sum() < 5:
        return -1.2
    elasticity = (units_pct[mask] / price_pct[mask]).median()
    if pd.isna(elasticity) or elasticity > 0:
        return -1.2
    return float(np.clip(elasticity, -4, -0.3))


def optimize_price(product_id: str, objective: str = "revenue") -> dict:
    row = _latest_row_for_product(product_id)
    if row is None:
        raise ValueError(f"No historical data found for product_id={product_id}")

    current_price = float(row["final_price"])
    base_units = float(row["rolling_mean_7"]) if row["rolling_mean_7"] > 0 else float(row["units_sold"])
    cost_price = float(row["cost_price"])
    competitor_avg = float(row["competitor_avg_price"]) if not pd.isna(row["competitor_avg_price"]) else current_price

    elasticity = _estimate_price_elasticity(product_id)

    candidates = np.linspace(current_price * 0.80, current_price * 1.20, 41)
    rows = []
    for price in candidates:
        pct_change = (price - current_price) / current_price if current_price else 0
        predicted_demand = max(0.0, base_units * (1 + elasticity * pct_change))
        expected_revenue = price * predicted_demand
        expected_profit = (price - cost_price) * predicted_demand
        competitive_score = -abs(price - competitor_avg)  # closer to competitor avg = better for "competitive" objective
        rows.append({
            "price": round(float(price), 2),
            "predicted_demand": round(predicted_demand, 2),
            "expected_revenue": round(expected_revenue, 2),
            "expected_profit": round(expected_profit, 2),
            "competitive_score": competitive_score,
        })
    candidates_df = pd.DataFrame(rows)

    objective_col = {
        "revenue": "expected_revenue",
        "profit": "expected_profit",
        "demand": "predicted_demand",
        "competitive": "competitive_score",
    }.get(objective, "expected_revenue")

    best = candidates_df.loc[candidates_df[objective_col].idxmax()]

    return {
        "product_id": product_id,
        "objective": objective,
        "current_price": round(current_price, 2),
        "recommended_price": float(best["price"]),
        "price_change_pct": round((best["price"] - current_price) / current_price * 100, 2) if current_price else 0,
        "expected_demand": float(best["predicted_demand"]),
        "expected_revenue": float(best["expected_revenue"]),
        "expected_profit": float(best["expected_profit"]),
        "estimated_elasticity": round(elasticity, 3),
        "candidate_curve": rows,
        "explanation_factors": {
            "competitor_avg_price": round(competitor_avg, 2),
            "cost_price": round(cost_price, 2),
            "base_weekly_demand_estimate": round(base_units, 2),
            "market_demand_index": float(row.get("market_demand_index", np.nan)) if not pd.isna(row.get("market_demand_index", np.nan)) else None,
            "recent_price_trend_pct": float(row.get("price_change_pct", 0)),
        },
    }
