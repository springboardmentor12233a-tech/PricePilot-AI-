"""
Demand Forecasting Module (PDF Section 4, Module 4).

Trains a Prophet model on ONE product's daily sales history and produces
forecasts across all 3 horizons the PDF specifies:
  - Short-term:  7, 14, 30 days
  - Medium-term: 3, 6 months
  - Long-term:   12 months

Output format matches the PDF's own worked example exactly:
  Forecast Period, Predicted Demand, Demand Trend, Confidence Score

TEACHING NOTE -- why Prophet instead of "just averaging past sales":
Prophet doesn't just extrapolate a straight line. It decomposes a time
series into: (1) an overall TREND (is demand generally rising/falling
over months), (2) SEASONALITY (do Mondays sell more than Sundays? does
December spike?), and (3) HOLIDAY EFFECTS. It learns these three
patterns separately from your history, then combines them to project
forward. This is why it needs a real date column (ds) and can't just
work off row numbers -- the actual calendar dates are what let it learn
"this is a Monday" or "this is near a holiday."

Run with:
    python -m app.ml.train_demand_forecasting
"""

import pandas as pd
import numpy as np
from prophet import Prophet
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.models import Product, Sale, DemandForecast

# (horizon_label, number_of_days) -- matches PDF's exact horizon names
HORIZONS = [
    ("7d", 7),
    ("14d", 14),
    ("30d", 30),
    ("3m", 90),
    ("6m", 180),
    ("12m", 365),
]


def pick_top_product(db) -> Product:
    """
    Picks the Favorita product (store+category combo) with the most total
    historical sales -- gives Prophet the richest history to learn from,
    which matters most while you're still verifying the pipeline works.
    """
    result = (
        db.query(Product, func.sum(Sale.quantity).label("total_qty"))
        .join(Sale, Sale.product_id == Product.id)
        .filter(Product.source_dataset == "favorita_sales")
        .group_by(Product.id)
        .order_by(func.sum(Sale.quantity).desc())
        .first()
    )
    return result[0]


def build_daily_series(db, product_id: int) -> pd.DataFrame:
    """
    Builds a complete daily time series for one product, filling in ZERO
    for any day with no sale record.

    TEACHING NOTE -- why we must fill missing dates with 0 (not skip them):
    If a product had zero sales on a Tuesday, that Tuesday simply won't
    have a row in the `sales` table -- but Prophet needs to SEE that zero
    to learn real patterns (e.g. "this product doesn't sell on Mondays").
    Silently skipping missing dates would make Prophet think time just
    jumps forward, corrupting its seasonality detection.
    """
    sales = (
        db.query(Sale.sale_date, Sale.quantity)
        .filter(Sale.product_id == product_id)
        .order_by(Sale.sale_date)
        .all()
    )
    df = pd.DataFrame(sales, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])

    # Some days may have multiple rows (shouldn't for Favorita, but safe to sum)
    df = df.groupby("ds", as_index=False)["y"].sum()

    full_range = pd.date_range(df["ds"].min(), df["ds"].max(), freq="D")
    df = df.set_index("ds").reindex(full_range, fill_value=0).rename_axis("ds").reset_index()

    return df


def classify_trend(forecast_segment: pd.DataFrame) -> str:
    """
    Increasing / Stable / Decreasing, per the PDF's exact 3 output
    categories. We compare the average forecast in the FIRST half of the
    horizon vs the SECOND half -- a simple, explainable rule rather than
    a black-box classifier, which matters here since you need to be able
    to explain this logic to your evaluator.
    """
    mid = len(forecast_segment) // 2
    first_half_avg = forecast_segment["yhat"].iloc[:mid].mean()
    second_half_avg = forecast_segment["yhat"].iloc[mid:].mean()

    if first_half_avg <= 0:
        return "Stable"  # avoid divide-by-zero; treat flat-zero history as stable

    pct_change = (second_half_avg - first_half_avg) / abs(first_half_avg)
    if pct_change > 0.05:
        return "Increasing"
    elif pct_change < -0.05:
        return "Decreasing"
    return "Stable"


def compute_confidence(forecast_segment: pd.DataFrame) -> float:
    """
    Turns Prophet's confidence INTERVAL (yhat_lower to yhat_upper) into a
    single 0-100 score, matching the PDF's "Confidence Score" output.

    Logic: a NARROW interval relative to the prediction means Prophet is
    confident; a WIDE interval means it's uncertain. We convert relative
    interval width into a 0-100 score, capped to a sensible range so an
    early, data-sparse forecast doesn't show a nonsensical 0% or negative
    value.
    """
    avg_yhat = forecast_segment["yhat"].mean()
    avg_interval_width = (forecast_segment["yhat_upper"] - forecast_segment["yhat_lower"]).mean()

    if avg_yhat <= 0:
        return 50.0  # neutral default when there's no meaningful signal to measure against

    relative_width = avg_interval_width / abs(avg_yhat)
    confidence = 100 - (relative_width * 25)  # scaling factor tuned so typical widths land in a believable 50-95 range
    return float(np.clip(confidence, 40, 95))


def train_and_forecast():
    db = SessionLocal()
    try:
        product = pick_top_product(db)
        print(f"Selected product: {product.name} (id={product.id}, external_id={product.external_id})")

        df = build_daily_series(db, product.id)
        print(f"Built daily series: {len(df)} days, from {df['ds'].min().date()} to {df['ds'].max().date()}")

        if len(df) < 30:
            print("WARNING: fewer than 30 days of history -- forecast quality will be poor. "
                  "This is expected if using sample/partial data.")

        model = Prophet(interval_width=0.85, seasonality_mode="multiplicative")
        # multiplicative mode: seasonal swings scale with the overall
        # sales level, rather than adding/subtracting a fixed amount.
        # This fits bursty retail data (many zero days + occasional big
        # spikes) much better than Prophet's default "additive" mode,
        # which assumes seasonal effects are a constant size regardless
        # of how much the product actually sells.
        # Ecuador's public holiday calendar, since Favorita is Ecuadorian --
        # lets Prophet learn holiday-specific demand spikes/drops directly
        # instead of us hand-coding them.
        model.add_country_holidays(country_name="EC")
        model.fit(df)

        max_horizon_days = max(days for _, days in HORIZONS)
        future = model.make_future_dataframe(periods=max_horizon_days, freq="D")
        forecast = model.predict(future)

        # Only the rows AFTER our real history are actual future predictions
        future_forecast = forecast[forecast["ds"] > df["ds"].max()].reset_index(drop=True)

        print("\n" + "=" * 60)
        print(f"DEMAND FORECAST: {product.name}")
        print("=" * 60)

        # Clear this product's previous forecast rows before inserting new
        # ones -- otherwise re-running this script (e.g. after tuning the
        # model) piles up duplicate/stale rows instead of replacing them.
        db.query(DemandForecast).filter(DemandForecast.product_id == product.id).delete()

        results = []
        for label, days in HORIZONS:
            segment = future_forecast.iloc[:days]
            # Clip EACH DAY to zero before summing -- a single day can't
            # have negative sales. Clipping only the final total (our
            # first attempt) let a few very-negative days cancel out
            # genuinely positive days, sometimes collapsing an entire
            # period's total to 0 even when real demand was predicted.
            predicted_units = float(segment["yhat"].clip(lower=0).sum())
            trend = classify_trend(segment)
            confidence = compute_confidence(segment)

            print(f"Forecast Period: Next {label}")
            print(f"  Predicted Demand: {predicted_units:,.0f} Units")
            print(f"  Demand Trend: {trend}")
            print(f"  Confidence Score: {confidence:.0f}%\n")

            results.append(DemandForecast(
                product_id=product.id,
                horizon=label,
                predicted_units=predicted_units,
                trend=trend,
                confidence_score=confidence,
                model_used="Prophet",
            ))

        db.add_all(results)
        db.commit()
        print(f"Saved {len(results)} forecast rows to demand_forecasts table.")

    finally:
        db.close()


if __name__ == "__main__":
    train_and_forecast()