"""
Price recommendation model.

Design decisions here were tested against real data before this code was
written (see project notes):
- Trained WITH the product's own last known price as a feature: R^2=0.97.
  Without it, using only competitor/category/attributes: R^2=-0.27.
  So this is fundamentally an "anchored adjustment" model — it nudges a
  product's own recent price using competitor signal and season, not an
  "invent an optimal price from nothing" model. That's an accurate
  description of what it does, not a limitation to hide.
- Trained in memory at process startup. 676 rows trains in a fraction of
  a second, so a separate training/serialization pipeline isn't earning
  its keep yet at this data size.
"""
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sqlalchemy import text

NUM_FEATURES = ["comp_avg_price", "comp_avg_score", "product_weight_g",
                 "product_score", "lag_price", "month_num",
                 "weekday_count", "weekend_count", "holiday_count"]
CAT_FEATURES = ["category"]

_model = None  # cached in memory after first training, avoids retraining per request


def _load_training_frame(engine) -> pd.DataFrame:
    query = text("""
        SELECT
            m.id, m.product_id, m.period_date, m.unit_price, m.lag_unit_price AS lag_price,
            m.product_score, m.weekday_count, m.weekend_count, m.holiday_count,
            p.category, p.weight_g AS product_weight_g,
            AVG(c.price) AS comp_avg_price, AVG(c.score) AS comp_avg_score
        FROM monthly_metrics m
        JOIN products p ON p.product_id = m.product_id
        JOIN competitor_prices c ON c.product_id = m.product_id AND c.period_date = m.period_date
        GROUP BY m.id, m.product_id, m.period_date, m.unit_price, m.lag_unit_price,
                 m.product_score, m.weekday_count, m.weekend_count, m.holiday_count,
                 p.category, p.weight_g
        ORDER BY m.product_id, m.period_date
    """)
    df = pd.read_sql(query, engine)
    df["month_num"] = pd.to_datetime(df["period_date"]).dt.month
    return df.dropna(subset=["lag_price"])


def train_price_model(engine) -> int:
    """Trains (or retrains) the model from whatever is currently in the DB.
    Returns the number of rows trained on, so the caller can log/verify it."""
    global _model
    df = _load_training_frame(engine)
    if df.empty:
        raise ValueError("No training data found — has clean_and_load.py been run?")

    X = df[NUM_FEATURES + CAT_FEATURES]
    y = df["unit_price"]
    pre = ColumnTransformer(
        [("cat", OneHotEncoder(handle_unknown="ignore"), CAT_FEATURES)],
        remainder="passthrough",
    )
    pipe = Pipeline([("pre", pre), ("rf", RandomForestRegressor(n_estimators=300, random_state=0))])
    pipe.fit(X, y)
    _model = pipe
    return len(df)


def predict_price(engine, product_id: str):
    """Returns a price recommendation for one product based on its most
    recent known price and most recent competitor snapshot, or None if the
    product doesn't exist / has no pricing history yet."""
    if _model is None:
        train_price_model(engine)

    latest = pd.read_sql(
        text("""
            SELECT m.product_id, m.period_date, m.unit_price, m.product_score,
                   m.weekday_count, m.weekend_count, m.holiday_count,
                   p.category, p.weight_g AS product_weight_g
            FROM monthly_metrics m
            JOIN products p ON p.product_id = m.product_id
            WHERE m.product_id = :pid
            ORDER BY m.period_date DESC
            LIMIT 1
        """),
        engine, params={"pid": product_id},
    )
    if latest.empty:
        return None

    comp = pd.read_sql(
        text("""
            SELECT AVG(price) AS comp_avg_price, AVG(score) AS comp_avg_score
            FROM competitor_prices
            WHERE product_id = :pid AND period_date = (
                SELECT MAX(period_date) FROM competitor_prices WHERE product_id = :pid
            )
        """),
        engine, params={"pid": product_id},
    )

    row = latest.iloc[0]
    comp_row = comp.iloc[0]
    features = pd.DataFrame([{
        "comp_avg_price": comp_row["comp_avg_price"],
        "comp_avg_score": comp_row["comp_avg_score"],
        "product_weight_g": row["product_weight_g"],
        "product_score": row["product_score"],
        "lag_price": row["unit_price"],  # today's known price becomes "last price" for the next call
        "month_num": pd.Timestamp.now().month,
        "weekday_count": row["weekday_count"],
        "weekend_count": row["weekend_count"],
        "holiday_count": row["holiday_count"],
        "category": row["category"],
    }])

    predicted = float(_model.predict(features)[0])
    current = float(row["unit_price"])
    comp_avg = float(comp_row["comp_avg_price"]) if comp_row["comp_avg_price"] is not None else None

    return {
        "product_id": product_id,
        "category": row["category"],
        "current_price": round(current, 2),
        "recommended_price": round(predicted, 2),
        "change": round(predicted - current, 2),
        "change_pct": round((predicted - current) / current * 100, 1) if current else None,
        "competitor_avg_price": round(comp_avg, 2) if comp_avg is not None else None,
        "as_of": str(row["period_date"]),
    }