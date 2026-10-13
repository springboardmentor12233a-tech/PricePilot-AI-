"""
Trains an XGBoost Regressor and a Random Forest Regressor to predict
final_price from operational/market features, compares them on a
chronological hold-out split, and saves the better model + metadata.

Run with: python -m app.ml.price_prediction.train_price_model
"""
import json
import os
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

from app.core.config import settings

FEATURE_COLS = [
    "cost_price", "base_price", "units_sold", "revenue", "discount_pct",
    "competitor_avg_price", "competitor_min_price", "market_demand_index",
    "stock_available", "is_weekend", "is_holiday", "is_festival_season",
    "is_promotional_event", "inflation_rate_pct", "consumer_confidence_index",
    "rating", "num_reviews", "price_change_pct", "competitor_price_gap",
    "competitor_price_ratio", "lag_1", "lag_7", "rolling_mean_7", "month", "quarter",
]
TARGET_COL = "final_price"
CATEGORICAL_COLS = ["category"]


def _load_feature_table() -> pd.DataFrame:
    processed_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.DATA_PROCESSED_DIR)
    path = os.path.normpath(os.path.join(processed_dir, "feature_table.csv"))
    if not os.path.exists(path):
        raise FileNotFoundError(
            "feature_table.csv not found. Run `python scripts/prepare_data.py` first."
        )
    df = pd.read_csv(path, parse_dates=["date"])
    return df


def _prepare_xy(df: pd.DataFrame):
    df = df.dropna(subset=[TARGET_COL]).copy()
    df = pd.get_dummies(df, columns=CATEGORICAL_COLS, dummy_na=False)
    dummy_cols = [c for c in df.columns if c.startswith("category_")]
    feature_cols = FEATURE_COLS + dummy_cols
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
    df[feature_cols] = df[feature_cols].fillna(0)
    return df, feature_cols


def train_and_evaluate():
    df = _load_feature_table().sort_values("date")
    df, feature_cols = _prepare_xy(df)

    # chronological split: 70% train / 15% val / 15% test
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)
    train, val, test = df.iloc[:train_end], df.iloc[train_end:val_end], df.iloc[val_end:]

    X_train, y_train = train[feature_cols], train[TARGET_COL]
    X_val, y_val = val[feature_cols], val[TARGET_COL]
    X_test, y_test = test[feature_cols], test[TARGET_COL]

    candidates = {
        "xgboost": XGBRegressor(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, random_state=42, n_jobs=-1,
        ),
        "random_forest": RandomForestRegressor(
            n_estimators=300, max_depth=12, random_state=42, n_jobs=-1,
        ),
    }

    results = {}
    fitted = {}
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        val_pred = model.predict(X_val)
        results[name] = {
            "val_mae": float(mean_absolute_error(y_val, val_pred)),
            "val_rmse": float(np.sqrt(mean_squared_error(y_val, val_pred))),
            "val_r2": float(r2_score(y_val, val_pred)),
        }
        fitted[name] = model

    best_name = min(results, key=lambda k: results[k]["val_mae"])
    best_model = fitted[best_name]

    test_pred = best_model.predict(X_test)
    test_metrics = {
        "test_mae": float(mean_absolute_error(y_test, test_pred)),
        "test_rmse": float(np.sqrt(mean_squared_error(y_test, test_pred))),
        "test_r2": float(r2_score(y_test, test_pred)),
    }

    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.MODELS_DIR)
    models_dir = os.path.normpath(models_dir)
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump({"model": best_model, "feature_cols": feature_cols}, os.path.join(models_dir, "price_model.joblib"))

    metadata = {
        "model_name": best_name,
        "trained_at": datetime.utcnow().isoformat(),
        "training_rows": int(len(train)),
        "validation_rows": int(len(val)),
        "test_rows": int(len(test)),
        "features": feature_cols,
        "candidates_compared": list(candidates.keys()),
        "validation_metrics": results,
        "test_metrics": test_metrics,
        "selected_because": "lowest validation MAE among trained candidates",
    }
    with open(os.path.join(models_dir, "price_model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(json.dumps(metadata, indent=2))
    return metadata


if __name__ == "__main__":
    train_and_evaluate()
