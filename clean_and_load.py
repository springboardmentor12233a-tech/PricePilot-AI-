"""
Clean retail_price.csv and load it into Postgres (products, monthly_metrics,
competitor_prices).

Usage:
    python3 clean_and_load.py

Expects Postgres reachable via DATABASE_URL (defaults to a local instance
with db `pricepilot`, user `postgres`, password `postgres`).
"""
import os
import sys
import pandas as pd
from sqlalchemy import create_engine

RAW_CSV = os.environ.get("RAW_CSV", "retail_price.csv")
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/pricepilot"
)

PRODUCT_ATTR_COLS = [
    "product_category_name", "product_name_lenght", "product_description_lenght",
    "product_photos_qty", "product_weight_g", "volume",
]


def load_raw(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    # Source column names have typos ("lenght") and CSV-generic naming
    # (qty, s) — renamed here to something a future reader won't have to
    # guess at. Nothing about the VALUES changes, only the labels.
    df = df.rename(columns={
        "product_name_lenght": "product_name_length",
        "product_description_lenght": "product_description_length",
        "qty": "qty_sold",
    })
    return df


def build_products(df: pd.DataFrame) -> pd.DataFrame:
    # Verify the assumption that product attributes are constant per
    # product_id before collapsing to one row each — if this ever fails,
    # something in the source data changed and this function needs to
    # change with it, not silently drop data.
    attr_cols = ["product_category_name", "product_name_length",
                 "product_description_length", "product_photos_qty",
                 "product_weight_g", "volume"]
    nunique_per_product = df.groupby("product_id")[attr_cols].nunique()
    inconsistent = nunique_per_product[(nunique_per_product > 1).any(axis=1)]
    if len(inconsistent):
        raise ValueError(
            f"{len(inconsistent)} product(s) have inconsistent attributes across rows "
            f"(expected these to be static per product): {inconsistent.index.tolist()}"
        )

    products = (
        df.drop_duplicates(subset="product_id")
        [["product_id", "product_category_name", "product_name_length",
          "product_description_length", "product_photos_qty",
          "product_weight_g", "volume"]]
        .rename(columns={
            "product_category_name": "category",
            "product_name_length": "name_length",
            "product_description_length": "description_length",
            "product_photos_qty": "photos_qty",
            "product_weight_g": "weight_g",
        })
        .reset_index(drop=True)
    )
    return products


def build_monthly_metrics(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    # month_year is DD-MM-YYYY with DD always "01" -> confirms the data is
    # monthly, not daily, despite the original spec assuming day-level
    # granularity. period_date stores the 1st of each month.
    out["period_date"] = pd.to_datetime(out["month_year"], format="%d-%m-%Y")

    metrics = out[[
        "product_id", "period_date", "qty_sold", "total_price", "freight_price",
        "unit_price", "lag_price", "product_score", "customers",
        "weekday", "weekend", "holiday", "s",
    ]].rename(columns={
        "lag_price": "lag_unit_price",
        "weekday": "weekday_count",
        "weekend": "weekend_count",
        "holiday": "holiday_count",
        "s": "s_metric",
    })

    dupes = metrics.duplicated(subset=["product_id", "period_date"]).sum()
    if dupes:
        raise ValueError(f"{dupes} duplicate (product_id, period_date) rows — expected 0")

    return metrics.reset_index(drop=True)


def build_competitor_prices(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["period_date"] = pd.to_datetime(out["month_year"], format="%d-%m-%Y")

    frames = []
    for n in (1, 2, 3):
        sub = out[["product_id", "period_date", f"comp_{n}", f"ps{n}", f"fp{n}"]].copy()
        sub.columns = ["product_id", "period_date", "price", "score", "freight_price"]
        sub["competitor_num"] = n
        frames.append(sub)

    competitors = pd.concat(frames, ignore_index=True)
    return competitors[["product_id", "period_date", "competitor_num", "price", "score", "freight_price"]]


def main():
    print(f"Reading {RAW_CSV} ...")
    raw = load_raw(RAW_CSV)
    print(f"  {len(raw)} rows, {raw['product_id'].nunique()} unique products")

    products = build_products(raw)
    metrics = build_monthly_metrics(raw)
    competitors = build_competitor_prices(raw)

    print(f"Built: products={len(products)}, monthly_metrics={len(metrics)}, "
          f"competitor_prices={len(competitors)}")

    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        # Safe to re-run: clear old data before reloading instead of
        # failing on duplicate product_ids. RESTART IDENTITY resets the
        # auto-incrementing ids too, so a re-run looks identical to a
        # fresh load, not a continuation of a previous one.
        conn.exec_driver_sql(
            "TRUNCATE products, monthly_metrics, competitor_prices RESTART IDENTITY CASCADE"
        )
        products.to_sql("products", conn, if_exists="append", index=False)
        metrics.to_sql("monthly_metrics", conn, if_exists="append", index=False)
        competitors.to_sql("competitor_prices", conn, if_exists="append", index=False)

    print("Loaded into Postgres successfully.")

    # Quick sanity read-back
    with engine.connect() as conn:
        counts = {
            "products": conn.exec_driver_sql("SELECT count(*) FROM products").scalar(),
            "monthly_metrics": conn.exec_driver_sql("SELECT count(*) FROM monthly_metrics").scalar(),
            "competitor_prices": conn.exec_driver_sql("SELECT count(*) FROM competitor_prices").scalar(),
        }
    print("Row counts in DB:", counts)


if __name__ == "__main__":
    sys.exit(main())