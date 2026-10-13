"""
ml_prediction.py
-----------------
Bridges Point 1 (the already-trained model) into Point 2/3.

It does NOT retrain anything. It only:
  1. Loads models/best_sales_prediction_model.pkl (created in Colab).
  2. Loads models/model_metrics.json (MAE / RMSE / R2 / model name), which
     your Colab notebook should save right after model selection
     (see the snippet at the bottom of this file / README "Connecting
     Point 1" section).
  3. Exposes predict_sales() so the dashboard / AI assistant can use the
     real trained model instead of guessing numbers.

If the .pkl or metrics file is missing, every function degrades gracefully
(returns None / empty dict) so the rest of the dashboard keeps working.
"""

from __future__ import annotations

import json
import os
import joblib
import pandas as pd


MODEL_PATH = os.path.join("models", "best_sales_prediction_model.pkl")
METRICS_PATH = os.path.join("models", "model_metrics.json")


def load_model(model_path: str = MODEL_PATH):
    """Load the pickled sklearn model saved by Point 1. Returns None if missing."""
    if not os.path.exists(model_path):
        return None
    try:
        return joblib.load(model_path)
    except Exception as e:
        print(f"[ml_prediction] Could not load model: {e}")
        return None


def load_metrics(metrics_path: str = METRICS_PATH) -> dict:
    """
    Load MAE / RMSE / R2 / best_model_name saved by Point 1.
    Expected JSON shape (produced by the Colab snippet below):
    {
      "best_model_name": "Random Forest",
      "mae": 123.45,
      "rmse": 234.56,
      "r2": 0.87
    }
    """
    if not os.path.exists(metrics_path):
        return {}
    try:
        with open(metrics_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ml_prediction] Could not load metrics: {e}")
        return {}


def get_expected_features(model) -> list:
    """Return the list of feature column names the model expects, if known."""
    if model is None:
        return []
    if hasattr(model, "feature_names_in_"):
        return list(model.feature_names_in_)
    return []


def predict_sales(model, feature_row: dict):
    """
    feature_row: dict of {column_name: value} matching the columns the
    model was trained on (see get_expected_features()).

    Returns the predicted value (float) or None if prediction fails
    (e.g. missing model, mismatched columns). Never fabricates a number.
    """
    if model is None:
        return None
    try:
        expected = get_expected_features(model)
        if expected:
            # build a single-row dataframe with columns in the right order;
            # missing keys become NaN rather than crashing
            row = {col: feature_row.get(col) for col in expected}
            X = pd.DataFrame([row], columns=expected)
        else:
            X = pd.DataFrame([feature_row])
        pred = model.predict(X)
        return float(pred[0])
    except Exception as e:
        print(f"[ml_prediction] Prediction failed: {e}")
        return None


# --------------------------------------------------------------------------
# Colab snippet (copy into the END of your Point 1 notebook, right after
# you pick the best model) — saves everything ml_prediction.py needs.
# --------------------------------------------------------------------------
COLAB_SAVE_SNIPPET = '''
import json, joblib

# best_model, best_model_name, mae, rmse, r2 should already exist
# from your Point 1 model comparison code.

joblib.dump(best_model, "best_sales_prediction_model.pkl")

metrics = {
    "best_model_name": best_model_name,
    "mae": float(mae),
    "rmse": float(rmse),
    "r2": float(r2),
}
with open("model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("Saved best_sales_prediction_model.pkl and model_metrics.json")
# Download both files and place them inside project/models/
'''

if __name__ == "__main__":
    m = load_model()
    metrics = load_metrics()
    print("Model loaded:", m is not None)
    print("Metrics:", metrics)
    if m is not None:
        print("Expected features:", get_expected_features(m))
