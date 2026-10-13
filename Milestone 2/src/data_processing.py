"""
data_processing.py
-------------------
Loads the four raw CSV datasets, cleans them, and produces the merged
tables that the KPI engine and dashboard rely on.

This module is intentionally dependency-light (pandas + numpy only) so it
can be reused unchanged from Google Colab (Point 1) or from the local
Streamlit app (Point 2 / Point 3).

Public functions
-----------------
load_raw_data(data_dir)        -> dict of raw dataframes
build_sales_master(raw)        -> daily_operations + product_catalog merged,
                                   with cost/profit columns added
build_funnel_table(raw)        -> customer_activity cleaned & typed
build_competitor_table(raw)    -> competitor_prices cleaned & typed
load_all(data_dir)             -> convenience wrapper that returns
                                   (sales_master, funnel, competitor, catalog)
"""

from __future__ import annotations

import os
import numpy as np
import pandas as pd


# --------------------------------------------------------------------------
# 1. RAW LOADING
# --------------------------------------------------------------------------
def load_raw_data(data_dir: str = "data") -> dict:
    """Load the four CSV files exactly as provided (no fabricated columns)."""

    paths = {
        "daily_operations": os.path.join(data_dir, "daily_operations.csv"),
        "customer_activity": os.path.join(data_dir, "customer_activity.csv"),
        "competitor_prices": os.path.join(data_dir, "competitor_prices.csv"),
        "product_catalog": os.path.join(data_dir, "product_catalog.csv"),
    }

    raw = {}
    for name, path in paths.items():
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Required dataset '{name}' not found at {path}. "
                f"Make sure all 4 CSV files are inside the data/ folder."
            )
        raw[name] = pd.read_csv(path)

    return raw


# --------------------------------------------------------------------------
# 2. SALES MASTER TABLE  (daily_operations + product_catalog)
# --------------------------------------------------------------------------
def build_sales_master(raw: dict) -> pd.DataFrame:
    """
    Merge daily_operations with product_catalog to attach cost_price,
    product_name, brand, subcategory, etc. Adds derived financial columns:
    total_cost, profit, profit_margin_pct.
    """

    do = raw["daily_operations"].copy()
    pc = raw["product_catalog"].copy()

    # ---- basic type cleanup ----
    do["date"] = pd.to_datetime(do["date"], errors="coerce")
    numeric_cols = [
        "list_price", "discount_pct", "final_price", "units_sold", "revenue",
        "stock_available", "competitor_avg_price", "competitor_min_price",
        "market_demand_index", "inflation_rate_pct", "consumer_confidence_index",
    ]
    for col in numeric_cols:
        if col in do.columns:
            do[col] = pd.to_numeric(do[col], errors="coerce")

    for col in ["restocked", "stockout_flag", "is_weekend", "is_holiday",
                "is_festival_season", "is_promotional_event"]:
        if col in do.columns:
            do[col] = do[col].astype(bool)

    # drop rows with no usable date or revenue (cannot compute KPIs from them)
    do = do.dropna(subset=["date"])

    # ---- product catalog cleanup ----
    pc["cost_price"] = pd.to_numeric(pc["cost_price"], errors="coerce")
    pc["base_price"] = pd.to_numeric(pc["base_price"], errors="coerce")
    pc["is_active"] = pc["is_active"].astype(bool)

    catalog_cols = ["product_id", "product_name", "subcategory", "brand",
                     "cost_price", "base_price", "rating", "num_reviews", "is_active"]
    catalog_cols = [c for c in catalog_cols if c in pc.columns]

    merged = do.merge(pc[catalog_cols], on="product_id", how="left", suffixes=("", "_catalog"))

    # If a product has no catalog match, cost_price will be NaN.
    # We do NOT invent a cost -> profit will be NaN for those rows (excluded
    # from profit-based KPIs, but still counted in revenue/units KPIs).
    merged["units_sold"] = merged["units_sold"].fillna(0)
    merged["revenue"] = merged["revenue"].fillna(0)

    merged["total_cost"] = merged["cost_price"] * merged["units_sold"]
    merged["profit"] = merged["revenue"] - merged["total_cost"]

    # month bucket for trend charts
    merged["year_month"] = merged["date"].dt.to_period("M").astype(str)

    # fallback product_name if catalog missing
    if "product_name" in merged.columns:
        merged["product_name"] = merged["product_name"].fillna(merged["product_id"])
    else:
        merged["product_name"] = merged["product_id"]

    return merged


# --------------------------------------------------------------------------
# 3. CUSTOMER FUNNEL TABLE (views / add_to_cart / purchase)
# --------------------------------------------------------------------------
def build_funnel_table(raw: dict) -> pd.DataFrame:
    ca = raw["customer_activity"].copy()

    ca["timestamp"] = pd.to_datetime(ca["timestamp"], errors="coerce")
    ca = ca.dropna(subset=["timestamp"])
    ca["date"] = ca["timestamp"].dt.date
    ca["date"] = pd.to_datetime(ca["date"])
    ca["year_month"] = ca["timestamp"].dt.to_period("M").astype(str)

    ca["price_shown"] = pd.to_numeric(ca.get("price_shown"), errors="coerce")
    ca["quantity"] = pd.to_numeric(ca.get("quantity"), errors="coerce")
    ca["total_amount"] = pd.to_numeric(ca.get("total_amount"), errors="coerce")

    # event_type is already one of view / add_to_cart / purchase — do not invent values
    ca["event_type"] = ca["event_type"].astype(str).str.strip().str.lower()

    return ca


# --------------------------------------------------------------------------
# 4. COMPETITOR PRICE TABLE
# --------------------------------------------------------------------------
def build_competitor_table(raw: dict) -> pd.DataFrame:
    cp = raw["competitor_prices"].copy()
    cp["date"] = pd.to_datetime(cp["date"], errors="coerce")
    cp = cp.dropna(subset=["date"])
    cp["competitor_price"] = pd.to_numeric(cp["competitor_price"], errors="coerce")
    cp["year_month"] = cp["date"].dt.to_period("M").astype(str)
    return cp


# --------------------------------------------------------------------------
# 5. CONVENIENCE LOADER
# --------------------------------------------------------------------------
def load_all(data_dir: str = "data"):
    """Returns (sales_master, funnel, competitor, catalog) ready for the KPI engine."""
    raw = load_raw_data(data_dir)
    sales_master = build_sales_master(raw)
    funnel = build_funnel_table(raw)
    competitor = build_competitor_table(raw)
    catalog = raw["product_catalog"].copy()
    return sales_master, funnel, competitor, catalog


if __name__ == "__main__":
    # quick manual smoke test: python src/data_processing.py
    sm, fn, cp, cat = load_all("data")
    print("sales_master:", sm.shape)
    print("funnel:", fn.shape)
    print("competitor:", cp.shape)
    print("catalog:", cat.shape)
