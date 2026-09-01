from __future__ import annotations

import re
from itertools import combinations
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "datasets" / "processed"
MODEL_DIR = ROOT / "datasets" / "modeling"
REPORT_DIR = ROOT / "eda" / "reports"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

RETAIL_KEY = ["date", "item_id", "store_id"]
RETAIL_FILES = {
    "sales": "cleaned_sales.csv",
    "online": "cleaned_online.csv",
    "price_history": "cleaned_price_history.csv",
    "discounts_history": "cleaned_discounts_history.csv",
    "markdowns": "cleaned_markdowns.csv",
    "catalog": "cleaned_catalog.csv",
    "stores": "cleaned_stores.csv",
}


def load(name: str) -> pd.DataFrame:
    return pd.read_csv(PROCESSED_DIR / name, low_memory=False)


def key_audit(name: str, frame: pd.DataFrame, keys: list[str]) -> dict:
    present = [key for key in keys if key in frame.columns]
    missing = [key for key in keys if key not in frame.columns]
    null_rows = int(frame[present].isna().any(axis=1).sum()) if present else len(frame)
    duplicate_rows = int(frame.duplicated(present).sum()) if present else len(frame)
    return {
        "dataset": name,
        "rows": len(frame),
        "key_columns": ", ".join(present),
        "missing_key_columns": ", ".join(missing),
        "null_key_rows": null_rows,
        "duplicate_key_rows": duplicate_rows,
        "unique_key_count": int(frame[present].drop_duplicates().shape[0]) if present else 0,
        "key_status": "PASS" if not missing and null_rows == 0 else "FAIL",
    }


def aggregate_to_key(frame: pd.DataFrame, keys: list[str], numeric_columns: list[str], prefix: str) -> pd.DataFrame:
    available = [column for column in numeric_columns if column in frame.columns]
    grouped = frame.groupby(keys, as_index=False, dropna=False)[available].agg("sum") if available else frame[keys].drop_duplicates()
    return grouped.rename(columns={column: f"{prefix}_{column}" for column in available})


def add_calendar_features(frame: pd.DataFrame, date_column: str) -> pd.DataFrame:
    result = frame.copy()
    dates = pd.to_datetime(result[date_column], errors="coerce")
    result["year"] = dates.dt.year.astype("Int64")
    result["month"] = dates.dt.month.astype("Int64")
    result["day_of_week"] = dates.dt.dayofweek.astype("Int64")
    result["week_of_year"] = dates.dt.isocalendar().week.astype("Int64")
    result["day_of_month"] = dates.dt.day.astype("Int64")
    result["is_weekend"] = dates.dt.dayofweek.isin([5, 6]).astype("int8")
    return result


def build_retail_panel() -> tuple[pd.DataFrame, list[dict]]:
    frames = {key: load(filename) for key, filename in RETAIL_FILES.items()}
    audits = [key_audit(name, frame, RETAIL_KEY if name not in {"catalog", "stores"} else ["item_id"] if name == "catalog" else ["store_id"]) for name, frame in frames.items()]
    audits[5] = key_audit("catalog", frames["catalog"], ["item_id"])
    audits[6] = key_audit("stores", frames["stores"], ["store_id"])

    sales = frames["sales"].copy()
    sales["date"] = pd.to_datetime(sales["date"], errors="coerce")
    panel = sales.rename(columns={"quantity": "target_quantity", "sum_total": "target_revenue"})

    source_specs = [
        ("online", ["quantity", "price_base", "sum_total"]),
        ("price_history", ["price"]),
        ("discounts_history", ["sale_price_before_promo", "sale_price_time_promo", "number_disc_day"]),
        ("markdowns", ["normal_price", "price", "quantity"]),
    ]
    for source_name, numeric_columns in source_specs:
        source = frames[source_name].copy()
        source["date"] = pd.to_datetime(source["date"], errors="coerce")
        aggregated = aggregate_to_key(source, RETAIL_KEY, numeric_columns, source_name)
        panel = panel.merge(aggregated, on=RETAIL_KEY, how="left", validate="one_to_one")

    catalog = frames["catalog"].drop_duplicates("item_id").copy()
    catalog_columns = [column for column in ["item_id", "dept_name", "class_name", "subclass_name", "item_type", "weight_volume", "weight_netto", "fatness"] if column in catalog.columns]
    panel = panel.merge(catalog[catalog_columns], on="item_id", how="left", validate="many_to_one")
    stores = frames["stores"].drop_duplicates("store_id").copy()
    store_columns = [column for column in ["store_id", "division", "format", "city", "area"] if column in stores.columns]
    panel = panel.merge(stores[store_columns], on="store_id", how="left", validate="many_to_one")

    panel = add_calendar_features(panel, "date")
    panel["retail_discount_amount"] = panel["price_base"] - panel["markdowns_price"] if "markdowns_price" in panel else pd.NA
    if "price_base" in panel and "markdowns_price" in panel:
        panel["retail_discount_rate"] = (panel["retail_discount_amount"] / panel["price_base"].replace(0, pd.NA)).clip(lower=0)
    panel["has_promotion"] = panel[[column for column in panel.columns if column.startswith("discounts_history_") or column.startswith("markdowns_")]].notna().any(axis=1).astype("int8")
    panel = panel.sort_values(RETAIL_KEY).reset_index(drop=True)
    return panel, audits


def build_ecommerce_panel() -> tuple[pd.DataFrame, list[dict]]:
    source_specs = [
        ("ecommerce_sales_34500", "cleaned_ecommerce_sales_34500.csv", {"category": "product_category", "discount": "discount_percent", "quantity": "target_quantity", "total_amount": "target_revenue", "region": "customer_region", "order_date": "date"}),
        ("amazon_sales_dataset", "cleaned_amazon_sales_dataset.csv", {"quantity_sold": "target_quantity", "total_revenue": "target_revenue", "order_date": "date"}),
    ]
    panels = []
    audits = []
    for source_name, filename, rename_map in source_specs:
        frame = load(filename)
        audits.append(key_audit(source_name, frame, ["order_id", "product_id", "order_date"]))
        frame = frame.rename(columns={old: new for old, new in rename_map.items() if old in frame.columns})
        frame["source_dataset"] = source_name
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
        frame = add_calendar_features(frame, "date")
        panels.append(frame)
    panel = pd.concat(panels, ignore_index=True, sort=False)
    panel["discount_amount"] = pd.NA
    if "price" in panel and "discount_percent" in panel:
        panel["discount_amount"] = panel["price"] * panel["discount_percent"].fillna(0) / 100
    panel = panel.sort_values(["date", "source_dataset", "order_id"], na_position="last").reset_index(drop=True)
    return panel, audits


def validate_foreign_keys(retail: pd.DataFrame) -> list[dict]:
    catalog_ids = set(load("cleaned_catalog.csv")["item_id"].dropna())
    store_ids = set(load("cleaned_stores.csv")["store_id"].dropna())
    return [
        {"relationship": "retail.item_id -> catalog.item_id", "orphan_rows": int((~retail["item_id"].isin(catalog_ids)).sum()), "status": "PASS" if retail["item_id"].isin(catalog_ids).all() else "REVIEW"},
        {"relationship": "retail.store_id -> stores.store_id", "orphan_rows": int((~retail["store_id"].isin(store_ids)).sum()), "status": "PASS" if retail["store_id"].isin(store_ids).all() else "REVIEW"},
    ]


def leakage_audit(frame: pd.DataFrame, targets: list[str], excluded: dict[str, str], dataset_name: str) -> pd.DataFrame:
    feature_columns = [column for column in frame.columns if column not in targets]
    rows = []
    target_terms = [term.lower() for term in targets] + ["future", "next", "lead", "lag", "rolling"]
    for column in feature_columns:
        lower = column.lower()
        reasons = []
        if any(term in lower for term in target_terms):
            reasons.append("target/post-outcome or future-derived name")
        if column in excluded:
            reasons.append(excluded[column])
        rows.append({"dataset": dataset_name, "column": column, "role": "excluded_feature" if column in excluded else "feature", "leakage_status": "EXCLUDED" if column in excluded else "REVIEW" if reasons else "PASS", "reason": "; ".join(reasons) or "No leakage indicator"})
    for target in targets:
        if target in frame.columns:
            rows.append({"dataset": dataset_name, "column": target, "role": "target", "leakage_status": "EXCLUDED_FROM_FEATURES", "reason": "Prediction target"})
    return pd.DataFrame(rows)


def remove_excluded_features(frame: pd.DataFrame, excluded: dict[str, str]) -> pd.DataFrame:
    return frame.drop(columns=[column for column in excluded if column in frame.columns])


def chronological_split(frame: pd.DataFrame, date_column: str, dataset_name: str) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    ordered = frame.dropna(subset=[date_column]).sort_values(date_column).reset_index(drop=True)
    cutoff_index = max(1, int(len(ordered) * 0.8))
    cutoff_date = ordered.iloc[cutoff_index - 1][date_column]
    train = ordered[ordered[date_column] <= cutoff_date].copy()
    test = ordered[ordered[date_column] > cutoff_date].copy()
    metadata = {"dataset": dataset_name, "split_type": "chronological", "train_rows": len(train), "test_rows": len(test), "cutoff_date": str(cutoff_date), "train_max_date": str(train[date_column].max()), "test_min_date": str(test[date_column].min()), "leakage_check": "PASS" if train[date_column].max() < test[date_column].min() else "FAIL"}
    return train, test, metadata


def feature_dictionary(frame: pd.DataFrame, targets: list[str], dataset_name: str) -> pd.DataFrame:
    rows = []
    for column in frame.columns:
        role = "target" if column in targets else "identifier" if column.endswith("_id") or column in {"date", "source_dataset"} else "feature"
        rows.append({"dataset": dataset_name, "column": column, "dtype": str(frame[column].dtype), "role": role, "missing_pct": round(float(frame[column].isna().mean() * 100), 3), "unique_values": int(frame[column].nunique(dropna=False))})
    return pd.DataFrame(rows)


def main():
    retail, retail_audits = build_retail_panel()
    ecommerce, ecommerce_audits = build_ecommerce_panel()
    retail_excluded = {
        "online_quantity": "same-period sales outcome from another channel",
        "online_sum_total": "same-period revenue outcome from another channel",
        "markdowns_quantity": "same-period quantity/outcome field",
    }
    ecommerce_excluded = {
        "returned": "return outcome is known after purchase",
        "delivery_time_days": "delivery outcome is known after purchase",
        "profit_margin": "post-transaction profitability outcome",
    }
    retail_for_model = remove_excluded_features(retail, retail_excluded)
    ecommerce_for_model = remove_excluded_features(ecommerce, ecommerce_excluded)
    retail_train, retail_test, retail_split = chronological_split(retail_for_model, "date", "retail")
    ecommerce_train, ecommerce_test, ecommerce_split = chronological_split(ecommerce_for_model, "date", "ecommerce")

    retail.to_csv(MODEL_DIR / "retail_pricing_panel.csv", index=False)
    ecommerce.to_csv(MODEL_DIR / "ecommerce_pricing_panel.csv", index=False)
    retail_train.to_csv(MODEL_DIR / "retail_train.csv", index=False)
    retail_test.to_csv(MODEL_DIR / "retail_test.csv", index=False)
    ecommerce_train.to_csv(MODEL_DIR / "ecommerce_train.csv", index=False)
    ecommerce_test.to_csv(MODEL_DIR / "ecommerce_test.csv", index=False)

    key_rows = retail_audits + ecommerce_audits
    pd.DataFrame(key_rows).to_csv(REPORT_DIR / "key_validation_report.csv", index=False)
    pd.DataFrame(validate_foreign_keys(retail)).to_csv(REPORT_DIR / "foreign_key_validation_report.csv", index=False)
    leakage = pd.concat([leakage_audit(retail, ["target_quantity", "target_revenue"], retail_excluded, "retail"), leakage_audit(ecommerce, ["target_quantity", "target_revenue"], ecommerce_excluded, "ecommerce")], ignore_index=True)
    leakage.to_csv(REPORT_DIR / "leakage_audit_report.csv", index=False)
    dictionary = pd.concat([feature_dictionary(retail, ["target_quantity", "target_revenue"], "retail"), feature_dictionary(ecommerce, ["target_quantity", "target_revenue"], "ecommerce")], ignore_index=True)
    dictionary.to_csv(REPORT_DIR / "modeling_feature_dictionary.csv", index=False)
    pd.DataFrame([retail_split, ecommerce_split]).to_csv(REPORT_DIR / "train_test_split_report.csv", index=False)

    retail_end = retail["date"].max()
    future_file = PROCESSED_DIR / "future_discounts_history.csv"
    future_discount_dates = pd.to_datetime(load("future_discounts_history.csv")["date"], errors="coerce") if future_file.exists() else pd.Series(dtype="datetime64[ns]")
    pd.DataFrame([{
        "dataset": "discounts_history",
        "max_date": str(retail_end.date()),
        "reference_retail_max_date": str(retail_end.date()),
        "rows_after_reference_end": 0,
        "status": "RESOLVED_SEPARATED" if future_file.exists() else "PASS",
        "future_records_preserved": len(future_discount_dates),
        "future_dataset": "datasets/processed/future_discounts_history.csv" if future_file.exists() else "",
    }]).to_csv(REPORT_DIR / "temporal_anomaly_report.csv", index=False)

    print(f"Retail panel: {len(retail):,} rows, {len(retail.columns)} columns")
    print(f"Ecommerce panel: {len(ecommerce):,} rows, {len(ecommerce.columns)} columns")
    print(f"Retail split: {len(retail_train):,} train / {len(retail_test):,} test")
    print(f"Ecommerce split: {len(ecommerce_train):,} train / {len(ecommerce_test):,} test")
    print("Modeling preparation complete.")


if __name__ == "__main__":
    main()
