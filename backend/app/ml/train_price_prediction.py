"""
Price Prediction Module (PDF Section 4, Module 3).

Trains an XGBoost Regressor to predict a product's unit_price based on
competitor prices, sales volume, seasonality flags, and product category --
matching the PDF's "Recommended Models > Machine Learning Models: XGBoost
Regressor" and the Price Prediction Module's feature list.

TEACHING NOTE -- why we rebuild the dataframe from the DATABASE rather than
just re-reading retail_price.csv directly:
We could train straight off the CSV, but going through the database instead
proves the whole pipeline works end-to-end (ingestion -> storage -> feature
engineering -> model), which is what the project brief's architecture
diagram actually describes. It also means if you add MORE competitor price
sources later (e.g. from a live scraper), this training script doesn't
change at all -- it just sees more rows in the same tables.

Run with:
    python -m app.ml.train_price_prediction
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
from pathlib import Path

from app.core.database import SessionLocal
from app.models.models import Product, PriceHistory, CompetitorPrice

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


def build_training_dataframe(db) -> pd.DataFrame:
    """
    Pulls Product + PriceHistory + CompetitorPrice rows for the
    retail_price_optimization source and reshapes them into ONE ROW PER
    (product, month) with competitor prices as columns again -- i.e. we
    reverse the wide->long transform we did during ingestion, because for
    TRAINING we actually want the wide shape back (one row = one training
    example, with comp_1/2/3 as separate feature columns).

    This back-and-forth (wide -> long for storage, long -> wide for
    training) is completely normal: databases favor long/normalized data
    (one fact per row), but ML models favor wide/feature-table data
    (one example per row, all its features as columns).
    """
    products = db.query(Product).filter(Product.source_dataset == "retail_price_optimization").all()
    product_ids = [p.id for p in products]
    product_lookup = {p.id: p for p in products}

    price_rows = db.query(PriceHistory).filter(PriceHistory.product_id.in_(product_ids)).all()
    comp_rows = db.query(CompetitorPrice).filter(CompetitorPrice.product_id.in_(product_ids)).all()

    # Build competitor price lookup: (product_id, recorded_at) -> {comp_1: x, comp_2: y, comp_3: z}
    comp_lookup: dict[tuple, dict] = {}
    for c in comp_rows:
        key = (c.product_id, c.recorded_at)
        comp_lookup.setdefault(key, {})[c.competitor_name] = c.price

    records = []
    for p in price_rows:
        key = (p.product_id, p.recorded_at)
        comps = comp_lookup.get(key, {})
        product = product_lookup[p.product_id]
        records.append({
            "product_id": p.product_id,
            "category": product.category,
            "price": p.price,               # TARGET: what we're predicting
            "freight_price": p.freight_price or 0.0,
            "lag_price": p.lag_price,
            "qty": p.qty or 0,
            "customers": p.customers or 0,
            "product_score": p.product_score or 0.0,
            "comp_1": comps.get("comp_1", np.nan),
            "comp_2": comps.get("comp_2", np.nan),
            "comp_3": comps.get("comp_3", np.nan),
            "month": p.recorded_at.month,
            "weekday_of_month_start": p.recorded_at.weekday(),
        })

    return pd.DataFrame(records)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Turns raw columns into features the model can actually learn from.

    - comp_avg / comp_min / comp_max: summarizing 3 competitor columns into
      aggregate signals is usually more useful to the model than 3 raw
      columns, especially with only 676 rows -- fewer, stronger features
      beat many noisy ones on small datasets.
    - category: XGBoost needs numbers, not text, so we one-hot encode it
      (each category becomes its own 0/1 column).
    """
    df = df.copy()
    df["comp_avg"] = df[["comp_1", "comp_2", "comp_3"]].mean(axis=1)
    df["comp_min"] = df[["comp_1", "comp_2", "comp_3"]].min(axis=1)
    df["comp_max"] = df[["comp_1", "comp_2", "comp_3"]].max(axis=1)

    # Fill any remaining missing competitor stats with the column's own mean
    # -- a simple, defensible default when a product truly has no competitor data.
    for col in ["comp_avg", "comp_min", "comp_max"]:
        df[col] = df[col].fillna(df[col].mean())

    # lag_price is missing for a product's very first recorded month (no
    # prior period exists yet). Fall back to that row's own price as the
    # best available estimate -- assumes "no info yet" is closest to
    # "priced the same as now", a reasonable default for a cold-start row.
    df["lag_price"] = df["lag_price"].fillna(df["price"])

    df = pd.get_dummies(df, columns=["category"], prefix="cat")

    return df


def train():
    db = SessionLocal()
    try:
        raw_df = build_training_dataframe(db)
        print(f"Loaded {len(raw_df)} training rows from database.")

        df = engineer_features(raw_df)

        feature_cols = [c for c in df.columns if c not in ("product_id", "price")]
        X = df[feature_cols]
        y = df["price"]

        # 80/20 train-test split: we hold out 20% of data the model NEVER
        # sees during training, so we can honestly measure how well it
        # generalizes to new data -- instead of just memorizing the training set.
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = XGBRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            random_state=42,
        )
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)

        print(f"MAE:  {mae:.2f}   (avg dollar error per prediction)")
        print(f"RMSE: {rmse:.2f}  (penalizes large errors more)")
        print(f"R2:   {r2:.3f}   (1.0 = perfect, 0 = no better than guessing the average)")

        # Save the trained model AND the exact feature column order, since
        # at prediction time we must feed the model columns in the same
        # order/shape it was trained on.
        joblib.dump({"model": model, "feature_cols": feature_cols}, MODEL_DIR / "price_prediction_model.pkl")
        print(f"Model saved to {MODEL_DIR / 'price_prediction_model.pkl'}")

        return {"mae": mae, "rmse": rmse, "r2": r2, "rows_used": len(df)}
    finally:
        db.close()


if __name__ == "__main__":
    train()
