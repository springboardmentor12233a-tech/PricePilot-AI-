

from pathlib import Path
import joblib
import pandas as pd

from app.schemas.pricing import PricePredictionRequest

MODEL_PATH = Path(__file__).resolve().parent / "saved_models" / "price_prediction_model.pkl"

_model_bundle = None  # loaded once, reused across requests (loading from disk is slow)


def _get_model_bundle():
    global _model_bundle
    if _model_bundle is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"No trained model found at {MODEL_PATH}. "
                "Run `python -m app.ml.train_price_prediction` first."
            )
        _model_bundle = joblib.load(MODEL_PATH)
    return _model_bundle


def predict_price(req: PricePredictionRequest) -> float:
    bundle = _get_model_bundle()
    model = bundle["model"]
    feature_cols = bundle["feature_cols"]

    comp_prices = [c for c in [req.comp_1, req.comp_2, req.comp_3] if c is not None]
    comp_avg = sum(comp_prices) / len(comp_prices) if comp_prices else req.lag_price
    comp_min = min(comp_prices) if comp_prices else req.lag_price
    comp_max = max(comp_prices) if comp_prices else req.lag_price

    row = {col: 0 for col in feature_cols}
    row["freight_price"] = req.freight_price
    row["lag_price"] = req.lag_price
    row["qty"] = req.qty
    row["customers"] = req.customers
    row["product_score"] = req.product_score
    row["comp_1"] = req.comp_1 if req.comp_1 is not None else comp_avg
    row["comp_2"] = req.comp_2 if req.comp_2 is not None else comp_avg
    row["comp_3"] = req.comp_3 if req.comp_3 is not None else comp_avg
    row["comp_avg"] = comp_avg
    row["comp_min"] = comp_min
    row["comp_max"] = comp_max
    row["month"] = req.month

    category_col = f"cat_{req.category}"
    if category_col in row:
        row[category_col] = 1

    X = pd.DataFrame([row])[feature_cols]
    prediction = model.predict(X)[0]

    return float(prediction)