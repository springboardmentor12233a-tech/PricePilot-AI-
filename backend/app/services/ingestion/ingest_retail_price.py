"""
Ingests retail_price.csv (Retail Price Optimization dataset) into:
  - Product          (one row per unique product_id)
  - PriceHistory     (one row per product per month, tracking price over time)
  - CompetitorPrice   (one row per competitor per product per month)

WHY this file's structure looks the way it does (teaching note):
This dataset is "wide" -- each row has comp_1/comp_2/comp_3 as separate
COLUMNS (one row = one product-month, with 3 competitors squeezed
sideways into that row). Our CompetitorPrice table is "long" -- one row
PER competitor observation. This mismatch is called "wide vs long" format,
and it's one of the most common transformations you'll do in real data
work. Pandas' `melt()` more) is the standard tool for wide->long, but
here we do it manually with a small loop since we only have 3 competitor
columns and manual is easier to follow/debug for a first pass.
"""

from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session

from app.models.models import Product, PriceHistory, CompetitorPrice


def ingest_retail_price(db: Session, csv_path: str) -> dict:
    df = pd.read_csv(csv_path)

    # month_year comes in as a string like "01-05-2017" (day-month-year).
    # We parse it now so every downstream row has a real datetime, not a
    # string -- this matters because our DB columns are DateTime type,
    # and because you can't sort/filter/forecast on strings correctly
    # (e.g. "09-01-2017" would sort before "10-01-2016" as a string,
    # which is wrong).
    df["month_year"] = pd.to_datetime(df["month_year"], format="%d-%m-%Y")

    products_created = 0
    price_history_rows = 0
    competitor_rows = 0

    # Track which product_ids we've already created a Product row for,
    # so 20 monthly rows for the same product don't create 20 duplicate
    # Product entries. This dict maps external_id -> our DB's Product.id
    product_cache: dict[str, int] = {}

    for _, row in df.iterrows():
        ext_id = row["product_id"]

        if ext_id not in product_cache:
            product = Product(
                external_id=ext_id,
                name=f"{row['product_category_name']} ({ext_id})",
                category=row["product_category_name"],
                current_price=float(row["unit_price"]),
                weight_g=float(row["product_weight_g"]) if pd.notna(row["product_weight_g"]) else None,
                source_dataset="retail_price_optimization",
            )
            db.add(product)
            db.flush()  # flush (not commit) lets us get product.id immediately
            product_cache[ext_id] = product.id
            products_created += 1

        product_id = product_cache[ext_id]

        # --- PriceHistory: this product's own price at this point in time ---
        db.add(PriceHistory(
            product_id=product_id,
            price=float(row["unit_price"]),
            freight_price=float(row["freight_price"]) if pd.notna(row["freight_price"]) else None,
            recorded_at=row["month_year"],
            lag_price=float(row["lag_price"]) if pd.notna(row["lag_price"]) else None,
            qty=int(row["qty"]) if pd.notna(row["qty"]) else None,
            customers=int(row["customers"]) if pd.notna(row["customers"]) else None,
            product_score=float(row["product_score"]) if pd.notna(row["product_score"]) else None,
        ))
        price_history_rows += 1

        # --- CompetitorPrice: unpack comp_1/comp_2/comp_3 into 3 separate rows ---
        for comp_num in [1, 2, 3]:
            comp_col = f"comp_{comp_num}"
            if comp_col in row and pd.notna(row[comp_col]):
                db.add(CompetitorPrice(
                    product_id=product_id,
                    competitor_name=f"comp_{comp_num}",
                    price=float(row[comp_col]),
                    recorded_at=row["month_year"],
                ))
                competitor_rows += 1

    db.commit()

    return {
        "products_created": products_created,
        "price_history_rows": price_history_rows,
        "competitor_rows": competitor_rows,
    }
