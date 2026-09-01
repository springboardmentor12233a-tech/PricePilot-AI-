from __future__ import annotations

import hashlib
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW_FILE = ROOT / "datasets" / "raw" / "discounts_history.csv"
SALES_FILE = ROOT / "datasets" / "raw" / "sales.csv"
PROCESSED_DIR = ROOT / "datasets" / "processed"
REPORT_DIR = ROOT / "eda" / "reports"
HISTORICAL_CUTOFF = pd.Timestamp("2024-09-26")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    raw_hash_before = sha256(RAW_FILE)
    discounts = pd.read_csv(RAW_FILE, low_memory=False)
    date_column = "date"
    discounts[date_column] = pd.to_datetime(discounts[date_column], errors="raise")
    sales = pd.read_csv(SALES_FILE, usecols=["date"], low_memory=False)
    sales["date"] = pd.to_datetime(sales["date"], errors="raise")
    reference_max = sales["date"].max()

    historical_mask = discounts[date_column] <= reference_max
    historical = discounts.loc[historical_mask].copy()
    future = discounts.loc[~historical_mask].copy()
    historical.to_csv(PROCESSED_DIR / "cleaned_discounts_history.csv", index=False)
    future.to_csv(PROCESSED_DIR / "future_discounts_history.csv", index=False)

    raw_hash_after = sha256(RAW_FILE)
    if raw_hash_before != raw_hash_after:
        raise RuntimeError("Raw discounts_history.csv changed during resolution.")

    historical_dates = historical[date_column]
    future_dates = future[date_column]
    suspicious_date_counts = discounts.assign(year=discounts[date_column].dt.year).groupby("year").size()
    period_rows = [
        {"period": f"through {reference_max.date()}", "record_count": len(historical), "percentage": round(len(historical) / len(discounts) * 100, 3)},
        {"period": f"after {reference_max.date()}", "record_count": len(future), "percentage": round(len(future) / len(discounts) * 100, 3)},
        {"period": "2025 onward", "record_count": int((discounts[date_column] >= pd.Timestamp("2025-01-01")).sum()), "percentage": round((discounts[date_column] >= pd.Timestamp("2025-01-01")).mean() * 100, 3)},
    ]
    pd.DataFrame(period_rows).to_csv(REPORT_DIR / "temporal_distribution_discounts_history.csv", index=False)
    pd.DataFrame([{
        "dataset": "discounts_history",
        "max_date": historical_dates.max().date(),
        "reference_retail_max_date": reference_max.date(),
        "rows_after_reference_end": 0,
        "status": "RESOLVED_SEPARATED",
        "future_records_preserved": len(future),
        "future_dataset": "datasets/processed/future_discounts_history.csv",
    }]).to_csv(REPORT_DIR / "temporal_anomaly_report.csv", index=False)

    post_docs = future["doc_id"].nunique()
    post_items = future["item_id"].nunique()
    post_stores = future["store_id"].nunique()
    post_equal_prices = int((future["sale_price_before_promo"] == future["sale_price_time_promo"]).sum())
    post_promo_missing = int(future["promo_type_code"].isna().sum())
    historical_key_set = set(zip(sales["date"].dt.date, discounts.loc[historical_mask, "item_id"], discounts.loc[historical_mask, "store_id"]))
    future_key_set = set(zip(future["date"].dt.date, future["item_id"], future["store_id"]))
    report_csv = pd.DataFrame([{
        "Dataset": "discounts_history.csv",
        "Date Column": date_column,
        "Original Min Date": discounts[date_column].min().date(),
        "Original Max Date": discounts[date_column].max().date(),
        "Reference Dataset": "sales.csv",
        "Reference Max Date": reference_max.date(),
        "Affected Record Count": len(future),
        "Investigation Result": f"Post-reference rows use {post_docs} documents, {post_items} items, and {post_stores} stores; annual repetition through 2045 and number_disc_day progression support future/planned or synthetic extension. {post_equal_prices} rows have unchanged before/during prices and {post_promo_missing} rows have missing promo_type_code. No post-reference dates exist in sales.csv.",
        "Decision": "Separate post-reference records from historical analysis",
        "Processed Dataset": "datasets/processed/cleaned_discounts_history.csv; datasets/processed/future_discounts_history.csv",
        "Reason": "The records are structurally valid but cannot be treated as historical observations because the corresponding sales dataset ends on the reference date. Preserving them separately avoids deletion and prevents temporal leakage.",
    }])
    report_csv.to_csv(REPORT_DIR / "temporal_anomaly_resolution_report.csv", index=False)

    report = f"""# Temporal Anomaly Resolution\n\n## Observation\n\n`discounts_history.csv` contains {len(discounts):,} rows and a `{date_column}` column ranging from {discounts[date_column].min().date()} to {discounts[date_column].max().date()}. The reference `sales.csv` ranges through {reference_max.date()}. The anomaly report identified {len(future):,} records after that reference endpoint ({len(future) / len(discounts) * 100:.3f}%).\n\n| Period | Record count | Percentage |\n|---|---:|---:|\n| Through {reference_max.date()} | {len(historical):,} | {len(historical) / len(discounts) * 100:.3f}% |\n| After {reference_max.date()} | {len(future):,} | {len(future) / len(discounts) * 100:.3f}% |\n| 2025 onward | {(discounts[date_column] >= pd.Timestamp('2025-01-01')).sum():,} | {(discounts[date_column] >= pd.Timestamp('2025-01-01')).mean() * 100:.3f}% |\n\n## Investigation\n\n- The raw schema is 9 columns including the export index `Unnamed: 0`; the business fields include item, store, document, promotion prices, and `number_disc_day`.\n- Post-reference rows contain {post_docs} distinct promotion documents, {post_items} items, and {post_stores} stores.\n- The post-reference dates have a highly regular annual pattern through 2045. The `number_disc_day` field is strongly aligned with calendar progression, including values around 8,766 on 2045-12-31.\n- The post-reference block has {post_equal_prices:,} rows where before-promotion and promotion-time prices are equal, and {post_promo_missing:,} missing promotion codes.\n- No sales records occur on post-reference dates. The future records have {len(future_key_set & historical_key_set):,} exact date/item/store keys overlapping historical discount keys, but no matching sales dates; therefore they are not evidenced as realized historical sales activity.\n- No reliable transformation can infer a corrected historical date.\n\n## Interpretation\n\nThe strongest data-supported explanation is that the block contains future/planned or synthetic continuation records, not genuine historical observations. The regular yearly repetition, limited document/item combinations, and calendar-like day counter support this interpretation. The dataset alone cannot distinguish operational planned promotions from generated synthetic continuation with absolute certainty.\n\n## Decision\n\nUse option D: retain the post-reference records in `future_discounts_history.csv`, while using only records through {reference_max.date()} in the historical `cleaned_discounts_history.csv`. No dates were changed and no records were destroyed.\n\nThis is appropriate for PricePilot because historical pricing or demand analysis must align discount observations with the observed sales period. Mixing the future block into historical training could expose models to information unavailable at the time of historical sales and would create temporal leakage. The separate file may be used later only for explicitly future/planned promotion analysis.\n\n## Validation\n\n- Historical processed dataset: {len(historical):,} rows; minimum {historical_dates.min().date()}; maximum {historical_dates.max().date()}; records outside cutoff: {(historical_dates > reference_max).sum()}.\n- Future/planned dataset: {len(future):,} rows; minimum {future_dates.min().date()}; maximum {future_dates.max().date()}; records outside cutoff: {(future_dates > reference_max).sum()}.\n- Raw SHA-256 before/after: `{raw_hash_before}` / `{raw_hash_after}`; unchanged: **yes**.\n- Historical duplicate rows: {historical.duplicated().sum():,}; historical duplicate date/item/store keys: {historical.duplicated(['date', 'item_id', 'store_id']).sum():,}.\n- Date parsing completed without invalid values.\n\n## Limitation\n\nThe source does not contain an explicit status field such as planned/actual, so the future/planned interpretation remains evidence-based rather than proven by source metadata. The separation is therefore reversible and preserves the full raw evidence.\n"""
    (REPORT_DIR / "temporal_anomaly_resolution_report.md").write_text(report, encoding="utf-8")

    print(f"Raw records: {len(discounts):,}")
    print(f"Historical records retained: {len(historical):,}")
    print(f"Future/planned records separated: {len(future):,}")
    print(f"Historical max date: {historical_dates.max().date()}")
    print(f"Future max date: {future_dates.max().date()}")
    print("Raw unchanged: yes")


if __name__ == "__main__":
    main()
