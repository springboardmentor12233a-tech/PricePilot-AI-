"""
Demand forecasting is trained per-product at request time (see forecast_demand.py)
because each product has its own demand pattern. This script runs the forecasting
pipeline across a sample of products to produce aggregate validation metrics for
the Model Performance page, and saves the result to models/demand_model_metadata.json.

Run with: python -m app.ml.demand_forecasting.train_demand_model
"""
import json
import os
from datetime import datetime

import numpy as np
import pandas as pd

from app.core.config import settings
from app.ml.demand_forecasting.forecast_demand import forecast_product_demand

PROCESSED_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.DATA_PROCESSED_DIR))
MODELS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.MODELS_DIR))


def run(sample_size: int = 15, horizon_days: int = 30) -> dict:
    path = os.path.join(PROCESSED_DIR, "feature_table.csv")
    df = pd.read_csv(path, usecols=["product_id"])
    products = df["product_id"].unique().tolist()[:sample_size]

    model_wins = {}
    maes, rmses, confidences = [], [], []
    for pid in products:
        try:
            result = forecast_product_demand(pid, horizon_days=horizon_days)
        except Exception:  # noqa: BLE001
            continue
        model_wins[result["model_used"]] = model_wins.get(result["model_used"], 0) + 1
        if result["mae"] is not None:
            maes.append(result["mae"])
        if result["rmse"] is not None:
            rmses.append(result["rmse"])
        confidences.append(result["confidence_score"])

    metadata = {
        "trained_at": datetime.utcnow().isoformat(),
        "products_evaluated": len(products),
        "horizon_days": horizon_days,
        "model_selection_counts": model_wins,
        "avg_val_mae": float(np.mean(maes)) if maes else None,
        "avg_val_rmse": float(np.mean(rmses)) if rmses else None,
        "avg_confidence_score": float(np.mean(confidences)) if confidences else None,
        "candidate_models": ["moving_average", "xgboost", "prophet (if installed)"],
        "validation_methodology": "Chronological 85/15 split per product; no shuffling of time-series data.",
    }
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(os.path.join(MODELS_DIR, "demand_model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print(json.dumps(metadata, indent=2))
    return metadata


if __name__ == "__main__":
    run()
