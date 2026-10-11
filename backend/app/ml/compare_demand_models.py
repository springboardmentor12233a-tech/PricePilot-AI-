

from itertools import product as param_product
from pathlib import Path

import pandas as pd
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics

from app.core.database import SessionLocal
from app.ml.train_demand_forecasting import pick_top_product, build_daily_series

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

# 4 x 2 x 2 = 16 combinations.
PARAM_GRID = {
    "changepoint_prior_scale": [0.01, 0.05, 0.1, 0.5],  # how flexible the trend line is allowed to be
    "seasonality_prior_scale": [1.0, 10.0],              # how strongly seasonality is allowed to fit
    "seasonality_mode": ["additive", "multiplicative"],  # fixed-size vs. scales-with-volume seasonal swings
}


def run_comparison(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pure function -- takes the daily (ds, y) series build_daily_series()
    already produces and returns a ranked comparison table. Separate from
    train() below so the grid logic itself is easy to read independent of
    the database plumbing.
    """
    total_days = (df["ds"].max() - df["ds"].min()).days

    # Scale the CV windows to however much history this product actually
    # has, instead of hard-coding day counts that might be larger than
    # the dataset itself. Floors keep tiny datasets from producing a
    # nonsensical 0-day window.
    initial_days = max(int(total_days * 0.5), 60)
    period_days = max(int(total_days * 0.15), 15)
    horizon_days = 30  # score every config on the same 30-day short-term horizon

    initial = f"{initial_days} days"
    period = f"{period_days} days"
    horizon = f"{horizon_days} days"

    print(
        f"CV windows -> initial: {initial}, period: {period}, horizon: {horizon} "
        f"(history spans {total_days} days total)"
    )

    combos = [
        dict(zip(PARAM_GRID.keys(), values))
        for values in param_product(*PARAM_GRID.values())
    ]

    rows = []
    for i, params in enumerate(combos, 1):
        print(f"[{i}/{len(combos)}] Testing {params}")
        model = Prophet(interval_width=0.85, **params)
        # Same Ecuador holiday calendar as the production script, so this
        # comparison is apples-to-apples with what actually gets deployed.
        model.add_country_holidays(country_name="EC")
        model.fit(df)

        cv_results = cross_validation(
            model,
            initial=initial,
            period=period,
            horizon=horizon,
            disable_tqdm=True,
        )
        # rolling_window=1 collapses every cutoff's predictions into ONE
        # summary row per config, instead of one row per cutoff -- we want
        # a single score per parameter combo to rank against the others.
        metrics = performance_metrics(cv_results, rolling_window=1)

        # Prophet silently DROPS the 'mape' column from performance_metrics
        # whenever any actual value is near zero (division-by-zero risk) --
        # and this product genuinely has zero-sales days (per your own
        # notes: many zero days, one day spiking to 8,062 units). Guard
        # for that instead of assuming the column exists.
        rows.append({
            **params,
            "rmse": metrics["rmse"].iloc[0],
            "mae": metrics["mae"].iloc[0],
            "mape": metrics["mape"].iloc[0] if "mape" in metrics.columns else None,
        })

    comparison = pd.DataFrame(rows).sort_values("rmse").reset_index(drop=True)
    return comparison


def train():
    db = SessionLocal()
    try:
        product = pick_top_product(db)
        print(f"Comparing Prophet configs for: {product.name}")

        df = build_daily_series(db, product.id)
        print(f"Daily series: {len(df)} days, from {df['ds'].min().date()} to {df['ds'].max().date()}")

        comparison = run_comparison(df)

        print("\n" + "=" * 72)
        print("All configs ranked by cross-validated RMSE (lowest = best):")
        print(comparison.to_string(index=False))

        best = comparison.iloc[0]
        best_params = {
            "changepoint_prior_scale": float(best["changepoint_prior_scale"]),
            "seasonality_prior_scale": float(best["seasonality_prior_scale"]),
            "seasonality_mode": best["seasonality_mode"],
        }
        print(f"\nBest config: {best_params}")
        print("=" * 72)

        out_path = MODEL_DIR / "demand_model_comparison.csv"
        comparison.to_csv(out_path, index=False)
        print(f"\nFull comparison table -> {out_path}  (screenshot/paste this for your slide)")

        print(
            "\nNext step: open train_demand_forecasting.py, find the line\n"
            '    model = Prophet(interval_width=0.85, seasonality_mode="multiplicative")\n'
            f"and update it to match the winning config above, then re-run\n"
            "that script normally to regenerate the real saved forecasts."
        )

    finally:
        db.close()


if __name__ == "__main__":
    train()