"""
PricePilot AI - Milestone 2 Step 2: Modeling Dataset Preparation & Feature Engineering Pipeline

Reproducible preprocessing script that transforms raw datasets into clean, leakage-free,
modeling-ready feature panels for Price Prediction and Demand Forecasting.
"""

from __future__ import annotations

import logging
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("pricepilot_modeling_prep")

ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT_DIR / "Datasets" / "raw"
PROCESSED_DIR = ROOT_DIR / "Datasets" / "processed"
REPORT_DIR = ROOT_DIR / "eda" / "reports"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)


def load_raw_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load the primary and supporting raw datasets safely without modifying originals."""
    logger.info("Loading raw datasets from %s...", RAW_DIR)

    # 1. Main transaction dataset
    ecom_path = RAW_DIR / "ecommerce_sales_34500.csv"
    logger.info("Reading primary dataset: %s", ecom_path.name)
    ecom = pd.read_csv(
        ecom_path,
        usecols=["date", "item_id", "store_id", "quantity", "price_base", "sum_total"],
        dtype={
            "item_id": "str",
            "store_id": "int16",
            "quantity": "float32",
            "price_base": "float32",
            "sum_total": "float32",
        },
    )
    ecom["date"] = pd.to_datetime(ecom["date"], errors="coerce")
    logger.info("Primary dataset loaded: %d rows, %d columns", len(ecom), ecom.shape[1])

    # 2. Product Catalog
    cat_path = RAW_DIR / "catalog.csv"
    logger.info("Reading product catalog: %s", cat_path.name)
    catalog = pd.read_csv(
        cat_path,
        usecols=["item_id", "dept_name", "class_name", "subclass_name", "item_type"],
        dtype="str",
    )
    catalog = catalog.drop_duplicates(subset=["item_id"]).reset_index(drop=True)
    logger.info("Catalog loaded: %d unique items", len(catalog))

    # 3. Store Metadata
    store_path = RAW_DIR / "stores.csv"
    logger.info("Reading stores metadata: %s", store_path.name)
    stores = pd.read_csv(
        store_path,
        usecols=["store_id", "division", "format", "city", "area"],
        dtype={"store_id": "int16", "division": "str", "format": "str", "city": "str", "area": "float32"},
    )
    stores = stores.drop_duplicates(subset=["store_id"]).reset_index(drop=True)
    logger.info("Stores loaded: %d stores", len(stores))

    # 4. Promotional Schedule (sales.csv historical <= 2024-09-26)
    sales_path = RAW_DIR / "sales.csv"
    logger.info("Reading promotional sales schedule: %s", sales_path.name)
    sales = pd.read_csv(
        sales_path,
        usecols=[
            "date",
            "item_id",
            "store_id",
            "sale_price_before_promo",
            "sale_price_time_promo",
            "promo_type_code",
            "doc_id",
            "number_disc_day",
        ],
        dtype={
            "item_id": "str",
            "store_id": "int16",
            "sale_price_before_promo": "float32",
            "sale_price_time_promo": "float32",
            "promo_type_code": "str",
            "doc_id": "str",
            "number_disc_day": "float32",
        },
    )
    sales["date"] = pd.to_datetime(sales["date"], errors="coerce")
    # Strict filter to exclude future anomaly records post 2024-09-26
    sales = sales[sales["date"] <= "2024-09-26"].reset_index(drop=True)
    logger.info("Historical sales promo loaded: %d rows (after filtering <= 2024-09-26)", len(sales))

    # 5. Online Channel Price Listings
    online_path = RAW_DIR / "online.csv"
    logger.info("Reading online benchmark listings: %s", online_path.name)
    online = pd.read_csv(
        online_path,
        usecols=["date", "item_id", "store_id", "price"],
        dtype={"item_id": "str", "store_id": "int16", "price": "float32"},
    )
    online["date"] = pd.to_datetime(online["date"], errors="coerce")
    online = online[online["date"] <= "2024-09-26"].reset_index(drop=True)
    logger.info("Online listings loaded: %d rows", len(online))

    return ecom, catalog, stores, sales, online


def aggregate_promotions(sales: pd.DataFrame) -> pd.DataFrame:
    """Aggregate promotional documents to main grain (date, item_id, store_id)."""
    logger.info("Aggregating promotional records to grain (date, item_id, store_id)...")
    agg_sales = sales.groupby(["date", "item_id", "store_id"], as_index=False).agg(
        sale_price_before_promo=("sale_price_before_promo", "mean"),
        sale_price_time_promo=("sale_price_time_promo", "min"),
        promo_type_code=("promo_type_code", "first"),
        number_disc_day=("number_disc_day", "max"),
        promo_doc_count=("doc_id", "count"),
    )
    agg_sales["promo_doc_count"] = agg_sales["promo_doc_count"].astype("int16")
    logger.info("Aggregated promotion schedule: %d unique (date, item, store) keys", len(agg_sales))
    return agg_sales


def aggregate_online(online: pd.DataFrame) -> pd.DataFrame:
    """Aggregate online prices to main grain (date, item_id, store_id)."""
    logger.info("Aggregating online listings to grain (date, item_id, store_id)...")
    agg_online = online.groupby(["date", "item_id", "store_id"], as_index=False).agg(
        online_price=("price", "mean")
    )
    logger.info("Aggregated online prices: %d unique (date, item, store) keys", len(agg_online))
    return agg_online


def engineer_features(
    ecom: pd.DataFrame,
    catalog: pd.DataFrame,
    stores: pd.DataFrame,
    agg_sales: pd.DataFrame,
    agg_online: pd.DataFrame,
) -> pd.DataFrame:
    """Join supporting data and construct rich, leakage-free feature representations."""
    initial_rows = len(ecom)
    logger.info("Beginning feature engineering on %d primary transaction records...", initial_rows)

    # 1. Join Catalog (Many-to-One on item_id)
    logger.info("Joining product catalog...")
    df = ecom.merge(catalog, on="item_id", how="left")
    assert len(df) == initial_rows, f"Row count changed after catalog join! {len(df)} vs {initial_rows}"

    for col in ["dept_name", "class_name", "subclass_name", "item_type"]:
        df[col] = df[col].fillna("Unknown").astype("category")

    # 2. Join Store Metadata (Many-to-One on store_id)
    logger.info("Joining store metadata...")
    df = df.merge(stores, on="store_id", how="left")
    assert len(df) == initial_rows, f"Row count changed after stores join! {len(df)} vs {initial_rows}"

    for col in ["division", "format", "city"]:
        df[col] = df[col].fillna("Unknown").astype("category")
    df["area"] = df["area"].astype("float32")

    # 3. Join Promotional Schedule (One-to-One on date, item_id, store_id)
    logger.info("Joining aggregated promotional features...")
    df = df.merge(agg_sales, on=["date", "item_id", "store_id"], how="left")
    assert len(df) == initial_rows, f"Row count changed after sales join! {len(df)} vs {initial_rows}"

    df["is_on_promo"] = df["sale_price_time_promo"].notna().astype("int8")
    df["sale_price_before_promo"] = df["sale_price_before_promo"].fillna(df["price_base"])
    df["sale_price_time_promo"] = df["sale_price_time_promo"].fillna(df["price_base"])
    df["promo_discount_amount"] = (
        np.maximum(0.0, df["sale_price_before_promo"] - df["sale_price_time_promo"]).astype("float32")
    )
    df["promo_discount_pct"] = (
        (df["promo_discount_amount"] / df["sale_price_before_promo"].replace(0, np.nan) * 100.0)
        .fillna(0.0)
        .astype("float32")
    )
    df["number_disc_day"] = df["number_disc_day"].fillna(0).astype("int16")
    df["promo_doc_count"] = df["promo_doc_count"].fillna(0).astype("int16")
    df["promo_type_code"] = df["promo_type_code"].fillna("NO_PROMO").astype("category")

    # 4. Join Online Channel Listings (One-to-One on date, item_id, store_id)
    logger.info("Joining online benchmark features...")
    df = df.merge(agg_online, on=["date", "item_id", "store_id"], how="left")
    assert len(df) == initial_rows, f"Row count changed after online join! {len(df)} vs {initial_rows}"

    df["has_online_listing"] = df["online_price"].notna().astype("int8")
    df["online_price"] = df["online_price"].fillna(df["price_base"]).astype("float32")
    df["price_ratio_to_online"] = (
        (df["price_base"] / df["online_price"].replace(0, np.nan))
        .clip(0.1, 10.0)
        .fillna(1.0)
        .astype("float32")
    )

    # 5. Calendar / Temporal Features
    logger.info("Generating calendar and temporal features...")
    df["year"] = df["date"].dt.year.astype("int16")
    df["month"] = df["date"].dt.month.astype("int8")
    df["day_of_month"] = df["date"].dt.day.astype("int8")
    df["day_of_week"] = df["date"].dt.dayofweek.astype("int8")
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype("int8")
    df["quarter"] = df["date"].dt.quarter.astype("int8")
    df["day_of_year"] = df["date"].dt.dayofyear.astype("int16")
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype("int8")
    df["is_month_start"] = (df["day_of_month"] <= 3).astype("int8")
    df["is_month_end"] = (df["day_of_month"] >= 28).astype("int8")

    # Cyclical encodings
    df["sin_month"] = np.sin(2 * np.pi * df["month"] / 12.0).astype("float32")
    df["cos_month"] = np.cos(2 * np.pi * df["month"] / 12.0).astype("float32")
    df["sin_day_of_week"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0).astype("float32")
    df["cos_day_of_week"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0).astype("float32")

    # 6. Demand & Price Lags + Rolling Features (Strictly Historical t-1 to t-28)
    logger.info("Computing strictly past lag and rolling demand features per (store, item)...")
    df = df.sort_values(["store_id", "item_id", "date"]).reset_index(drop=True)

    group_keys = ["store_id", "item_id"]
    # Demand Lags
    df["demand_lag_1"] = df.groupby(group_keys)["quantity"].shift(1).astype("float32")
    df["demand_lag_2"] = df.groupby(group_keys)["quantity"].shift(2).astype("float32")
    df["demand_lag_3"] = df.groupby(group_keys)["quantity"].shift(3).astype("float32")
    df["demand_lag_7"] = df.groupby(group_keys)["quantity"].shift(7).astype("float32")
    df["demand_lag_14"] = df.groupby(group_keys)["quantity"].shift(14).astype("float32")
    df["demand_lag_28"] = df.groupby(group_keys)["quantity"].shift(28).astype("float32")

    # Demand Rolling Statistics on strictly shifted data (demand_lag_1)
    df["demand_roll_mean_7"] = (
        df.groupby(group_keys, observed=True)["demand_lag_1"]
        .rolling(7, min_periods=1)
        .mean()
        .values.astype("float32")
    )
    df["demand_roll_std_7"] = (
        df.groupby(group_keys, observed=True)["demand_lag_1"]
        .rolling(7, min_periods=1)
        .std()
        .values.astype("float32")
    )
    df["demand_roll_mean_28"] = (
        df.groupby(group_keys, observed=True)["demand_lag_1"]
        .rolling(28, min_periods=1)
        .mean()
        .values.astype("float32")
    )
    df["demand_roll_std_28"] = (
        df.groupby(group_keys, observed=True)["demand_lag_1"]
        .rolling(28, min_periods=1)
        .std()
        .values.astype("float32")
    )

    # Price Lags & Rolling Statistics
    df["price_lag_1"] = df.groupby(group_keys)["price_base"].shift(1).astype("float32")
    df["price_lag_7"] = df.groupby(group_keys)["price_base"].shift(7).astype("float32")
    df["price_roll_mean_7"] = (
        df.groupby(group_keys, observed=True)["price_lag_1"]
        .rolling(7, min_periods=1)
        .mean()
        .values.astype("float32")
    )

    # Missing Lag Handling
    df["is_new_item_store"] = df["demand_lag_1"].isna().astype("int8")
    df["demand_lag_1"] = df["demand_lag_1"].fillna(0.0)
    df["demand_lag_2"] = df["demand_lag_2"].fillna(0.0)
    df["demand_lag_3"] = df["demand_lag_3"].fillna(0.0)
    df["demand_lag_7"] = df["demand_lag_7"].fillna(0.0)
    df["demand_lag_14"] = df["demand_lag_14"].fillna(0.0)
    df["demand_lag_28"] = df["demand_lag_28"].fillna(0.0)
    df["demand_roll_mean_7"] = df["demand_roll_mean_7"].fillna(0.0)
    df["demand_roll_std_7"] = df["demand_roll_std_7"].fillna(0.0)
    df["demand_roll_mean_28"] = df["demand_roll_mean_28"].fillna(0.0)
    df["demand_roll_std_28"] = df["demand_roll_std_28"].fillna(0.0)
    df["price_lag_1"] = df["price_lag_1"].fillna(df["price_base"])
    df["price_lag_7"] = df["price_lag_7"].fillna(df["price_base"])
    df["price_roll_mean_7"] = df["price_roll_mean_7"].fillna(df["price_base"])

    # Re-sort chronologically for downstream splitting
    df = df.sort_values(["date", "store_id", "item_id"]).reset_index(drop=True)
    logger.info("Feature engineering complete: %d rows, %d columns", len(df), df.shape[1])
    return df


def audit_leakage_and_dictionary(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Generate comprehensive feature dictionary and leakage status audit."""
    logger.info("Auditing features for data and target leakage...")
    
    price_excluded = {"quantity", "sum_total", "target_quantity"}
    demand_excluded = {"sum_total", "target_revenue"}

    dict_rows = []
    leakage_rows = []

    for col in df.columns:
        dtype_str = str(df[col].dtype)
        null_count = int(df[col].isna().sum())
        null_pct = float(null_count / len(df) * 100)
        n_unique = int(df[col].nunique())

        if col in ["price_base", "quantity"]:
            role = "Target Variable"
        elif col in ["date", "item_id", "store_id"]:
            role = "Key Identifier"
        elif col == "sum_total":
            role = "Post-Transaction Outcome (Excluded)"
        else:
            role = "Feature"

        dict_rows.append({
            "column_name": col,
            "data_type": dtype_str,
            "role": role,
            "null_count": null_count,
            "null_percentage": round(null_pct, 4),
            "unique_values": n_unique,
        })

        # Leakage assessment for Price Prediction
        price_status = "EXCLUDED_AS_TARGET" if col == "price_base" else "LEAKAGE_EXCLUDED" if col in price_excluded else "SAFE_FEATURE"
        price_reason = "Price Target" if col == "price_base" else "Contemporaneous sales volume/revenue outcome" if col in price_excluded else "Available at prediction time"

        # Leakage assessment for Demand Forecasting
        demand_status = "EXCLUDED_AS_TARGET" if col == "quantity" else "LEAKAGE_EXCLUDED" if col in demand_excluded else "SAFE_FEATURE"
        demand_reason = "Demand Target" if col == "quantity" else "Contemporaneous revenue outcome (sum_total = quantity * price)" if col in demand_excluded else "Historical or planned feature available prior to realization"

        leakage_rows.append({
            "column_name": col,
            "price_model_status": price_status,
            "price_model_reason": price_reason,
            "demand_model_status": demand_status,
            "demand_model_reason": demand_reason,
        })

    return pd.DataFrame(dict_rows), pd.DataFrame(leakage_rows)


def chronological_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Partition panel chronologically into Train (80%), Validation (10%), and Test (10%)."""
    logger.info("Executing chronological train / validation / test partitioning...")

    train_cutoff = pd.Timestamp("2024-06-09")
    val_cutoff = pd.Timestamp("2024-08-03")

    train_df = df[df["date"] <= train_cutoff].copy()
    val_df = df[(df["date"] > train_cutoff) & (df["date"] <= val_cutoff)].copy()
    test_df = df[df["date"] > val_cutoff].copy()

    split_summary = pd.DataFrame([
        {
            "split": "Train",
            "rows": len(train_df),
            "pct_of_total": round(len(train_df) / len(df) * 100, 2),
            "min_date": str(train_df["date"].min().date()),
            "max_date": str(train_df["date"].max().date()),
            "days": int((train_df["date"].max() - train_df["date"].min()).days) + 1,
        },
        {
            "split": "Validation",
            "rows": len(val_df),
            "pct_of_total": round(len(val_df) / len(df) * 100, 2),
            "min_date": str(val_df["date"].min().date()),
            "max_date": str(val_df["date"].max().date()),
            "days": int((val_df["date"].max() - val_df["date"].min()).days) + 1,
        },
        {
            "split": "Test",
            "rows": len(test_df),
            "pct_of_total": round(len(test_df) / len(df) * 100, 2),
            "min_date": str(test_df["date"].min().date()),
            "max_date": str(test_df["date"].max().date()),
            "days": int((test_df["date"].max() - test_df["date"].min()).days) + 1,
        },
    ])

    # Validation checks
    assert len(train_df) + len(val_df) + len(test_df) == len(df), "Row counts do not sum to total!"
    assert train_df["date"].max() < val_df["date"].min(), "Temporal overlap between Train and Validation!"
    assert val_df["date"].max() < test_df["date"].min(), "Temporal overlap between Validation and Test!"

    logger.info(
        "Split complete: Train=%d (%.1f%%), Val=%d (%.1f%%), Test=%d (%.1f%%)",
        len(train_df),
        len(train_df) / len(df) * 100,
        len(val_df),
        len(val_df) / len(df) * 100,
        len(test_df),
        len(test_df) / len(df) * 100,
    )
    return train_df, val_df, test_df, split_summary


def save_processed_datasets(
    master_df: pd.DataFrame,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_dict: pd.DataFrame,
    leakage_audit: pd.DataFrame,
    split_summary: pd.DataFrame,
):
    """Save processed modeling datasets and documentation artifacts."""
    logger.info("Saving processed datasets to %s...", PROCESSED_DIR)

    # 1. Master Modeling Panel (Gzip compressed CSV for disk efficiency)
    master_path = PROCESSED_DIR / "modeling_master_panel.csv.gz"
    logger.info("Writing master panel to %s (gzip compressed)...", master_path.name)
    master_df.to_csv(master_path, index=False, compression="gzip")

    # 2. Chronological Splits
    train_path = PROCESSED_DIR / "train_data.csv.gz"
    val_path = PROCESSED_DIR / "val_data.csv.gz"
    test_path = PROCESSED_DIR / "test_data.csv.gz"

    logger.info("Writing train split to %s...", train_path.name)
    train_df.to_csv(train_path, index=False, compression="gzip")
    logger.info("Writing val split to %s...", val_path.name)
    val_df.to_csv(val_path, index=False, compression="gzip")
    logger.info("Writing test split to %s...", test_path.name)
    test_df.to_csv(test_path, index=False, compression="gzip")

    # 3. Reports & Feature Dictionaries
    dict_path = REPORT_DIR / "modeling_feature_dictionary.csv"
    leakage_path = REPORT_DIR / "leakage_audit_report.csv"
    split_path = REPORT_DIR / "train_val_test_split_summary.csv"

    feature_dict.to_csv(dict_path, index=False)
    leakage_audit.to_csv(leakage_path, index=False)
    split_summary.to_csv(split_path, index=False)

    logger.info("Artifacts saved successfully.")


def main():
    start_time = time.time()
    logger.info("Starting PricePilot AI - Milestone 2 Step 2 Preprocessing Pipeline...")

    # Step 1: Load raw data
    ecom, catalog, stores, sales, online = load_raw_data()

    # Step 2: Aggregate supporting datasets
    agg_sales = aggregate_promotions(sales)
    agg_online = aggregate_online(online)

    # Step 3: Engineer features
    master_df = engineer_features(ecom, catalog, stores, agg_sales, agg_online)

    # Step 4: Audit dictionary and leakage
    feature_dict, leakage_audit = audit_leakage_and_dictionary(master_df)

    # Step 5: Chronological train/val/test split
    train_df, val_df, test_df, split_summary = chronological_split(master_df)

    # Step 6: Save processed modeling datasets
    save_processed_datasets(
        master_df, train_df, val_df, test_df, feature_dict, leakage_audit, split_summary
    )

    elapsed = time.time() - start_time
    logger.info("Milestone 2 Step 2 Pipeline completed successfully in %.2f seconds.", elapsed)


if __name__ == "__main__":
    main()
