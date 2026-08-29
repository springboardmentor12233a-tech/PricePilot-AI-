"""
Demand Forecasting -- XGBoost comparison model (PDF Section 6:
"Recommended Models > Machine Learning Models: XGBoost Regressor").

Prophet (train_demand_forecasting.py) is purpose-built for time series
and handles seasonality/trend automatically. This script takes a
DIFFERENT approach: manually engineer time-based features (day of week,
month, recent sales) and let XGBoost -- the same general-purpose model
we used for price prediction -- learn the pattern instead.

TEACHING NOTE -- why we engineer LAG features:
XGBoost doesn't understand "time" the way Prophet does -- it just sees
rows of numbers. To give it a sense of recent momentum, we manually
create "lag" features: what did this product sell 1 day ago? 7 days ago?
What's the rolling 7-day average? These let XGBoost infer "sales have
been climbing lately" from the numbers alone, without any built-in
understanding of dates.

Run with:
    python -m app.ml.train_demand_xgboost
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
from pathlib import Path

from app.core.database import SessionLocal
from app.ml.train_demand_forecasting import pick_top_product, build_daily_series

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


def engineer_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    df must have columns: ds (date), y (units sold that day).
    Adds lag features, rolling averages, and calendar features.
    """
    df = df.copy().sort_values("ds").reset_index(drop=True)

    # Calendar features -- let the model learn weekday/monthly patterns
    df["day_of_week"] = df["ds"].dt.dayofweek
    df["day_of_month"] = df["ds"].dt.day
    df["month"] = df["ds"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Lag features -- recent history as explicit numeric inputs
    df["lag_1"] = df["y"].shift(1)
    df["lag_7"] = df["y"].shift(7)
    df["lag_14"] = df["y"].shift(14)
    df["rolling_mean_7"] = df["y"].shift(1).rolling(window=7).mean()
    df["rolling_mean_30"] = df["y"].shift(1).rolling(window=30).mean()

    # First 30 rows won't have full lag/rolling history yet -- drop them
    # rather than fill with fake zeros, which would teach the model a
    # false pattern.
    df = df.dropna().reset_index(drop=True)

    return df


def train():
    db = SessionLocal()
    try:
        product = pick_top_product(db)
        print(f"Training XGBoost demand model for: {product.name}")

        raw_df = build_daily_series(db, product.id)
        df = engineer_time_features(raw_df)
        print(f"Rows after feature engineering (post lag dropna): {len(df)}")

        feature_cols = [
            "day_of_week", "day_of_month", "month", "is_weekend",
            "lag_1", "lag_7", "lag_14", "rolling_mean_7", "rolling_mean_30",
        ]
        X = df[feature_cols]
        y = df["y"]

        # IMPORTANT: shuffle=False here (unlike price prediction's random
        # split). Time series data must be split chronologically -- testing
        # on a random scatter of days would let the model "peek" at future
        # patterns via nearby dates, giving a falsely good score. We train
        # on the FIRST 80% of days, test on the LAST 20% (genuinely unseen future).
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )

        model = XGBRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        preds_clipped = np.clip(preds, 0, None)  # sales can't be negative

        mae = mean_absolute_error(y_test, preds_clipped)
        rmse = np.sqrt(mean_squared_error(y_test, preds_clipped))
        r2 = r2_score(y_test, preds_clipped)

        print(f"\nXGBoost Demand Forecasting -- {product.name}")
        print(f"MAE:  {mae:.2f} units")
        print(f"RMSE: {rmse:.2f} units")
        print(f"R2:   {r2:.3f}")

        joblib.dump(
            {"model": model, "feature_cols": feature_cols, "product_id": product.id},
            MODEL_DIR / "demand_xgboost_model.pkl",
        )
        print(f"Model saved to {MODEL_DIR / 'demand_xgboost_model.pkl'}")

        return {"mae": mae, "rmse": rmse, "r2": r2}
    finally:
        db.close()


if __name__ == "__main__":
    train()