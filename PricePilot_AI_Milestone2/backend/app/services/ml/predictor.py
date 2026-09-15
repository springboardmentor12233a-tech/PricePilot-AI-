"""
PricePilot AI — Milestone 2
ML Prediction Service (Price & Demand)
========================================
Loads trained model artifacts and exposes prediction functions
for use by the FastAPI v2 router.
"""

import os
import logging
import numpy as np
import pandas as pd
from typing import Optional
import joblib

logger = logging.getLogger(__name__)

# ─── Artifact Paths ──────────────────────────────────────────────────────────
_BASE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "artifacts")
PRICE_MODEL_PATH  = os.path.normpath(os.path.join(_BASE, "price_model.pkl"))
DEMAND_MODEL_PATH = os.path.normpath(os.path.join(_BASE, "demand_model.pkl"))

_price_artifact  = None
_demand_artifact = None


def _load_artifacts():
    global _price_artifact, _demand_artifact
    if _price_artifact is None and os.path.exists(PRICE_MODEL_PATH):
        _price_artifact = joblib.load(PRICE_MODEL_PATH)
        logger.info(f"✅ Price model loaded: {_price_artifact['model_name']} (R²={_price_artifact['test_r2']:.4f})")
    if _demand_artifact is None and os.path.exists(DEMAND_MODEL_PATH):
        _demand_artifact = joblib.load(DEMAND_MODEL_PATH)
        logger.info(f"✅ Demand model loaded: {_demand_artifact['model_name']} (R²={_demand_artifact['test_r2']:.4f})")


def get_model_info() -> dict:
    """Return metadata about the currently loaded models."""
    _load_artifacts()
    return {
        "price_model": {
            "name": _price_artifact["model_name"] if _price_artifact else "Not loaded",
            "test_r2": _price_artifact["test_r2"] if _price_artifact else None,
            "features": _price_artifact["features"] if _price_artifact else [],
        },
        "demand_model": {
            "name": _demand_artifact["model_name"] if _demand_artifact else "Not loaded",
            "test_r2": _demand_artifact["test_r2"] if _demand_artifact else None,
            "features": _demand_artifact["features"] if _demand_artifact else [],
        },
    }


def predict_price(
    cost_price: float,
    base_price: float,
    comp_1_price: float,
    comp_2_price: float,
    comp_3_price: float,
    category: str,
    sales_channel: str,
    stock_level: int,
    rating: float,
    units_sold: float,
    is_promotion: int = 0,
    is_holiday: int = 0,
    month: int = 6,
    quarter: int = 2,
    is_weekend: int = 0,
) -> dict:
    """Predict optimal selling price using the trained price model."""
    _load_artifacts()
    if _price_artifact is None:
        return {"error": "Price model not found. Run ml/train_and_select.py first."}

    artifact = _price_artifact
    le_cat  = artifact["le_category"]
    le_chan = artifact["le_channel"]

    # Safe label encoding (handle unseen labels)
    try:
        cat_enc = le_cat.transform([category])[0]
    except ValueError:
        cat_enc = 0
    try:
        chan_enc = le_chan.transform([sales_channel])[0]
    except ValueError:
        chan_enc = 0

    avg_comp   = (comp_1_price + comp_2_price + comp_3_price) / 3
    log_price  = np.log1p(base_price)
    margin_pct = (base_price - cost_price) / max(base_price, 1)
    discount_depth = 0.0

    feature_row = {
        "cost_price":              cost_price,
        "base_price":              base_price,
        "comp_1_price":            comp_1_price,
        "comp_2_price":            comp_2_price,
        "comp_3_price":            comp_3_price,
        "avg_comp_price":          avg_comp,
        "price_to_comp1_ratio":    base_price / max(comp_1_price, 1),
        "margin_pct":              margin_pct,
        "discount_depth":          discount_depth,
        "category_enc":            cat_enc,
        "sales_channel_enc":       chan_enc,
        "stock_level":             stock_level,
        "rating":                  rating,
        "is_promotion":            is_promotion,
        "is_holiday":              is_holiday,
        "month":                   month,
        "quarter":                 quarter,
        "is_weekend":              is_weekend,
        "units_sold":              units_sold,
        "log_price":               log_price,
    }

    X = pd.DataFrame([feature_row])[artifact["features"]].fillna(0)
    model = artifact["model"]
    scaler = artifact["scaler"]
    X_inp = scaler.transform(X) if scaler is not None else X.values
    predicted = float(model.predict(X_inp)[0])

    return {
        "predicted_price": round(predicted, 2),
        "model_used": artifact["model_name"],
        "model_r2": artifact["test_r2"],
        "avg_competitor_price": round(avg_comp, 2),
        "price_vs_competitors": round(predicted - avg_comp, 2),
    }


def predict_demand(
    current_price: float,
    cost_price: float,
    base_price: float,
    comp_1_price: float,
    comp_2_price: float,
    comp_3_price: float,
    category: str,
    sales_channel: str,
    stock_level: int,
    rating: float,
    is_promotion: int = 0,
    is_holiday: int = 0,
    month: int = 6,
    quarter: int = 2,
    day_of_week: int = 2,
    is_weekend: int = 0,
) -> dict:
    """Predict daily unit demand using the trained demand model."""
    _load_artifacts()
    if _demand_artifact is None:
        return {"error": "Demand model not found. Run ml/train_and_select.py first."}

    artifact = _demand_artifact
    le_cat  = artifact["le_category"]
    le_chan = artifact["le_channel"]

    try:
        cat_enc = le_cat.transform([category])[0]
    except ValueError:
        cat_enc = 0
    try:
        chan_enc = le_chan.transform([sales_channel])[0]
    except ValueError:
        chan_enc = 0

    avg_comp        = (comp_1_price + comp_2_price + comp_3_price) / 3
    log_price       = np.log1p(current_price)
    margin_pct      = (current_price - cost_price) / max(current_price, 1)
    discount_depth  = (base_price - current_price) / max(base_price, 1)
    price_vs_comp   = current_price - avg_comp

    feature_row = {
        "current_price":           current_price,
        "log_price":               log_price,
        "cost_price":              cost_price,
        "base_price":              base_price,
        "comp_1_price":            comp_1_price,
        "comp_2_price":            comp_2_price,
        "comp_3_price":            comp_3_price,
        "price_to_comp1_ratio":    current_price / max(comp_1_price, 1),
        "price_vs_avg_comp":       price_vs_comp,
        "margin_pct":              margin_pct,
        "discount_depth":          discount_depth,
        "category_enc":            cat_enc,
        "sales_channel_enc":       chan_enc,
        "stock_level":             stock_level,
        "rating":                  rating,
        "is_promotion":            is_promotion,
        "is_holiday":              is_holiday,
        "month":                   month,
        "quarter":                 quarter,
        "day_of_week":             day_of_week,
        "is_weekend":              is_weekend,
    }

    X = pd.DataFrame([feature_row])[artifact["features"]].fillna(0)
    model = artifact["model"]
    scaler = artifact["scaler"]
    X_inp = scaler.transform(X) if scaler is not None else X.values
    predicted = float(model.predict(X_inp)[0])
    predicted = max(0, predicted)

    return {
        "predicted_demand_units": round(predicted, 1),
        "predicted_revenue":      round(predicted * current_price, 2),
        "model_used":             artifact["model_name"],
        "model_r2":               artifact["test_r2"],
    }
