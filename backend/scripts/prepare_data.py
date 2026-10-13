"""
Run with:  python scripts/prepare_data.py

1. Loads the four raw CSVs
2. Validates schemas
3. Cleans data (missing values, duplicates, invalid prices, outliers)
4. Generates engineered features
5. Writes processed CSVs to data/processed/
6. Loads the cleaned raw tables into PostgreSQL
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.database.db import Base, SessionLocal, engine  # noqa: E402
from app.models import models  # noqa: E402  (ensures models are registered)
from app.services.data_pipeline import (  # noqa: E402
    load_datasets, validate_datasets, clean_data, merge_datasets,
    create_features, save_processed_data,
)


def load_into_postgres(clean: dict[str, pd.DataFrame]) -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        products = clean["products"].copy()
        products["launch_date"] = products["launch_date"].dt.date
        conn.execute(text("DELETE FROM price_predictions"))
        conn.execute(text("DELETE FROM demand_forecasts"))
        conn.execute(text("DELETE FROM pricing_recommendations"))
        conn.execute(text("DELETE FROM ai_alerts"))
        conn.execute(text("DELETE FROM daily_operations"))
        conn.execute(text("DELETE FROM customer_activity"))
        conn.execute(text("DELETE FROM competitor_prices"))
        conn.execute(text("DELETE FROM products"))

        products.to_sql("products", conn, if_exists="append", index=False)

        ops = clean["daily_operations"].copy()
        ops["date"] = ops["date"].dt.date
        ops.to_sql("daily_operations", conn, if_exists="append", index=False)

        activity = clean["customer_activity"].copy()
        activity.to_sql("customer_activity", conn, if_exists="append", index=False)

        competitors = clean["competitor_prices"].copy()
        competitors["date"] = competitors["date"].dt.date
        competitors.to_sql("competitor_prices", conn, if_exists="append", index=False)

    print("Loaded cleaned datasets into PostgreSQL.")


def main():
    print("1/6 Loading raw datasets...")
    raw = load_datasets()

    print("2/6 Validating schemas...")
    report = validate_datasets(raw)
    for name, info in report.items():
        print(f"   {name}: {info['rows']} rows, {info['duplicate_rows']} duplicate rows,"
              f" nulls={info['null_counts']}")

    print("3/6 Cleaning data...")
    clean = clean_data(raw)

    print("4/6 Merging & engineering features...")
    merged = merge_datasets(clean)
    features = create_features(merged)

    print("5/6 Saving processed data to data/processed/ ...")
    save_processed_data(clean, features)

    print("6/6 Loading cleaned data into PostgreSQL...")
    try:
        load_into_postgres(clean)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "Could not load cleaned data into PostgreSQL. "
            "Processed CSVs were still written to data/processed/."
        ) from exc

    print("Done. feature_table.csv has", len(features), "rows.")


if __name__ == "__main__":
    main()
