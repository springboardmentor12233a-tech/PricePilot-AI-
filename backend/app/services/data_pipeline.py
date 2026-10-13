"""
Reusable data pipeline for PricePilot AI.

load_datasets()      -> read the four raw CSVs
validate_datasets()  -> schema / sanity checks, returns a report dict
clean_data()         -> handle missing values, duplicates, invalid rows, outliers
merge_datasets()     -> join on product_id / date to build model-ready tables
create_features()    -> feature engineering (lags, rolling stats, ratios...)
save_processed_data()-> persist parquet/csv outputs to data/processed/
"""
from __future__ import annotations

import os
from typing import Dict

import numpy as np
import pandas as pd

from app.core.config import settings

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "..", settings.DATA_RAW_DIR)
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", settings.DATA_PROCESSED_DIR)


def _p(path_fragment: str, base: str) -> str:
    return os.path.normpath(os.path.join(base, path_fragment))


def load_datasets() -> Dict[str, pd.DataFrame]:
    products = pd.read_csv(_p("product_catalog.csv", RAW_DIR))
    ops = pd.read_csv(_p("daily_operations.csv", RAW_DIR))
    activity = pd.read_csv(_p("customer_activity.csv", RAW_DIR))
    competitors = pd.read_csv(_p("competitor_prices.csv", RAW_DIR))
    return {
        "products": products,
        "daily_operations": ops,
        "customer_activity": activity,
        "competitor_prices": competitors,
    }


REQUIRED_COLUMNS = {
    "products": {"product_id", "product_name", "category", "cost_price", "base_price"},
    "daily_operations": {"date", "product_id", "final_price", "units_sold", "revenue"},
    "customer_activity": {"event_id", "timestamp", "product_id", "event_type"},
    "competitor_prices": {"date", "product_id", "competitor_name", "competitor_price"},
}


def validate_datasets(datasets: Dict[str, pd.DataFrame]) -> Dict[str, dict]:
    report = {}
    for name, df in datasets.items():
        missing_cols = REQUIRED_COLUMNS[name] - set(df.columns)
        report[name] = {
            "rows": int(len(df)),
            "columns": list(df.columns),
            "missing_required_columns": list(missing_cols),
            "null_counts": {k: int(v) for k, v in df.isnull().sum().to_dict().items() if v > 0},
            "duplicate_rows": int(df.duplicated().sum()),
        }
        if missing_cols:
            raise ValueError(f"Dataset '{name}' is missing required columns: {missing_cols}")
    return report


def _clip_outliers(series: pd.Series, lower_q=0.01, upper_q=0.99) -> pd.Series:
    lo, hi = series.quantile(lower_q), series.quantile(upper_q)
    return series.clip(lower=lo, upper=hi)


def clean_data(datasets: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    products = datasets["products"].copy()
    ops = datasets["daily_operations"].copy()
    activity = datasets["customer_activity"].copy()
    competitors = datasets["competitor_prices"].copy()

    # --- products ---
    products = products.drop_duplicates(subset="product_id")
    products["cost_price"] = products["cost_price"].clip(lower=0.01)
    products["base_price"] = products["base_price"].clip(lower=0.01)
    products["rating"] = products["rating"].clip(lower=0, upper=5)
    products["is_active"] = products["is_active"].astype(bool)
    products["launch_date"] = pd.to_datetime(products["launch_date"], errors="coerce")

    # --- daily_operations ---
    ops = ops.drop_duplicates()
    ops["date"] = pd.to_datetime(ops["date"], errors="coerce")
    ops = ops.dropna(subset=["date", "product_id"])
    for col in ["list_price", "final_price", "units_sold", "revenue"]:
        ops[col] = pd.to_numeric(ops[col], errors="coerce")
    ops = ops[(ops["final_price"].isna()) | (ops["final_price"] > 0)]
    ops["units_sold"] = ops["units_sold"].fillna(0).clip(lower=0)
    ops["revenue"] = ops["revenue"].fillna(ops["final_price"] * ops["units_sold"])
    ops["revenue"] = ops["revenue"].clip(lower=0)
    ops["discount_pct"] = ops["discount_pct"].fillna(0).clip(lower=0, upper=90)
    # fill missing competitor snapshot with rolling median per product (no leakage: only past/median)
    for col in ["competitor_avg_price", "competitor_min_price"]:
        ops[col] = ops.groupby("product_id")[col].transform(lambda s: s.fillna(s.median()))
    ops["market_demand_index"] = ops["market_demand_index"].fillna(ops["market_demand_index"].median())
    ops["units_sold"] = _clip_outliers(ops["units_sold"], 0.001, 0.995)
    ops = ops.sort_values(["product_id", "date"]).reset_index(drop=True)

    # --- customer_activity ---
    activity["timestamp"] = pd.to_datetime(activity["timestamp"], errors="coerce")
    activity = activity.dropna(subset=["timestamp", "product_id", "event_type"])
    activity["quantity"] = pd.to_numeric(activity["quantity"], errors="coerce")
    activity["total_amount"] = pd.to_numeric(activity["total_amount"], errors="coerce")
    activity = activity.drop_duplicates(subset="event_id")

    # --- competitor_prices ---
    competitors["date"] = pd.to_datetime(competitors["date"], errors="coerce")
    competitors = competitors.dropna(subset=["date", "product_id", "competitor_price"])
    competitors = competitors[competitors["competitor_price"] > 0]
    competitors["in_stock"] = competitors["in_stock"].astype(bool)
    competitors = competitors.drop_duplicates(subset=["date", "product_id", "competitor_name"])

    return {
        "products": products,
        "daily_operations": ops,
        "customer_activity": activity,
        "competitor_prices": competitors,
    }


def merge_datasets(datasets: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Primary model-ready table: daily_operations enriched with product attributes
    and a daily competitor aggregate (recomputed from the raw competitor feed,
    independent of the pre-baked competitor_avg_price column, for cross-validation)."""
    ops = datasets["daily_operations"]
    # NOTE: "category" is intentionally excluded here -- daily_operations already has its
    # own category column, and keeping both would create a duplicate/object-typed
    # "category_catalog" column downstream that breaks ML training.
    products = datasets["products"][["product_id", "product_name", "subcategory",
                                      "brand", "cost_price", "base_price", "rating", "num_reviews"]]
    competitors = datasets["competitor_prices"]

    comp_daily = (
        competitors.groupby(["product_id", "date"])["competitor_price"]
        .agg(["mean", "min", "max", "count"]).reset_index()
        .rename(columns={"mean": "comp_mean_live", "min": "comp_min_live",
                          "max": "comp_max_live", "count": "comp_count_live"})
    )

    merged = ops.merge(products, on="product_id", how="left", suffixes=("", "_catalog"))
    merged = merged.merge(comp_daily, on=["product_id", "date"], how="left")
    return merged


def create_features(merged: pd.DataFrame) -> pd.DataFrame:
    df = merged.sort_values(["product_id", "date"]).copy()

    # Pricing features
    df["price_change_pct"] = df.groupby("product_id")["final_price"].pct_change().fillna(0) * 100
    df["competitor_price_gap"] = df["final_price"] - df["competitor_avg_price"]
    df["competitor_price_ratio"] = df["final_price"] / df["competitor_avg_price"].replace(0, np.nan)
    df["price_index"] = df["final_price"] / df["base_price"].replace(0, np.nan)

    # Demand (lags & rolling stats on units_sold, grouped by product)
    g = df.groupby("product_id")["units_sold"]
    for lag in (1, 7, 14, 30):
        df[f"lag_{lag}"] = g.shift(lag)
    df["rolling_mean_7"] = g.transform(lambda s: s.shift(1).rolling(7, min_periods=1).mean())
    df["rolling_mean_14"] = g.transform(lambda s: s.shift(1).rolling(14, min_periods=1).mean())
    df["rolling_mean_30"] = g.transform(lambda s: s.shift(1).rolling(30, min_periods=1).mean())
    df["rolling_std_7"] = g.transform(lambda s: s.shift(1).rolling(7, min_periods=1).std())
    df["rolling_std_30"] = g.transform(lambda s: s.shift(1).rolling(30, min_periods=1).std())

    # Sales
    df["revenue_per_unit"] = df["revenue"] / df["units_sold"].replace(0, np.nan)
    df["sales_growth"] = df.groupby("product_id")["units_sold"].pct_change().fillna(0)
    df["revenue_growth"] = df.groupby("product_id")["revenue"].pct_change().fillna(0)

    # Inventory
    df["stock_ratio"] = df["stock_available"] / (df["units_sold"] + 1)
    df["stockout_frequency"] = df.groupby("product_id")["stockout_flag"].transform(
        lambda s: s.rolling(30, min_periods=1).mean()
    )
    df["inventory_turnover"] = df["units_sold"] / (df["stock_available"].replace(0, np.nan))

    # Seasonality
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)

    # Estimated economics
    df["estimated_cost"] = df["units_sold"] * df["cost_price"]
    df["estimated_gross_profit"] = df["revenue"] - df["estimated_cost"]

    df = df.fillna({
        "lag_1": 0, "lag_7": 0, "lag_14": 0, "lag_30": 0,
        "rolling_mean_7": 0, "rolling_mean_14": 0, "rolling_mean_30": 0,
        "rolling_std_7": 0, "rolling_std_30": 0,
        "competitor_price_gap": 0, "competitor_price_ratio": 1.0, "price_index": 1.0,
    })
    return df


def save_processed_data(datasets: Dict[str, pd.DataFrame], feature_table: pd.DataFrame) -> None:
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    for name, df in datasets.items():
        df.to_csv(os.path.join(PROCESSED_DIR, f"{name}_clean.csv"), index=False)
    feature_table.to_csv(os.path.join(PROCESSED_DIR, "feature_table.csv"), index=False)


def run_full_pipeline() -> pd.DataFrame:
    raw = load_datasets()
    validate_datasets(raw)
    clean = clean_data(raw)
    merged = merge_datasets(clean)
    features = create_features(merged)
    save_processed_data(clean, features)
    return features
