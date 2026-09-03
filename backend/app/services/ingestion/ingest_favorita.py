"""
Ingests favorita_sales.csv into:
  - Product   (one row per unique store + product family combination)
  - Sale      (one row per day, matching the PDF's Sales Features:
               historical sales volume, units sold, revenue, product category)

WHY we treat (store_nbr, family) as the "product" here (teaching note):
Unlike retail_price.csv which has real individual products (bed1, bed2...),
this dataset only tracks sales at the PRODUCT FAMILY level per store
(e.g. "BEVERAGES at Store 1"), not individual SKUs. So our best matching
unit of "product" for this dataset is (store, family) -- that's the most
granular thing we can forecast demand for here. This is a normal real-world
compromise: your Product table is generic enough to represent different
granularities from different sources, tagged by source_dataset so you
never confuse a Favorita "product" with a retail_price.csv product.
"""

import pandas as pd
from sqlalchemy.orm import Session

from app.models.models import Product, Sale


def ingest_favorita(db: Session, csv_path: str, sample_frac: float | None = None) -> dict:
    df = pd.read_csv(csv_path)

    # Drop the stray fully-empty column we found during inspection.
    if "Unnamed: 17" in df.columns:
        df = df.drop(columns=["Unnamed: 17"])

    df["date"] = pd.to_datetime(df["date"])

    # OPTIONAL: for a first test run, you can ingest a smaller sample so it
    # runs in seconds instead of minutes while you're checking correctness.
    # e.g. ingest_favorita(db, path, sample_frac=0.1) loads ~10% of rows.
    if sample_frac is not None:
        df = df.sample(frac=sample_frac, random_state=42)

    products_created = 0
    sales_rows = 0

    # Cache key is (store_nbr, family) -> our DB Product.id
    product_cache: dict[tuple, int] = {}

    for _, row in df.iterrows():
        key = (row["store_nbr"], row["family"])

        if key not in product_cache:
            product = Product(
                external_id=f"store{row['store_nbr']}_{row['family']}",
                name=f"{row['family']} @ Store {row['store_nbr']}",
                category=row["family"],
                current_price=0.0,  # this dataset doesn't track unit price, only sales volume
                source_dataset="favorita_sales",
            )
            db.add(product)
            db.flush()
            product_cache[key] = product.id
            products_created += 1

        product_id = product_cache[key]

        # is_holiday: this dataset merges the holidays_events table onto
        # every row, so almost every row has SOME locale/description value
        # -- checking "is locale non-empty" (my first attempt) was wrong,
        # it flagged nearly everything as a holiday. The correct signal is
        # type_y == "Holiday" (as opposed to "Event"/"Bridge"/"Additional")
        # AND transferred == False (a transferred holiday was moved to a
        # different actual date, so the ORIGINAL date is a normal workday).
        is_actual_holiday = (
            str(row.get("type_y", "")).strip() == "Holiday"
            and row.get("transferred") is not True
        )

        db.add(Sale(
            product_id=product_id,
            quantity=int(row["sales"]),   # "sales" in this dataset = units sold, not revenue
            revenue=float(row["sales"]),  # no separate revenue column; using units as proxy
            sale_date=row["date"],
            is_holiday=1 if is_actual_holiday else 0,
            is_promo=1 if row.get("onpromotion", 0) and int(row["onpromotion"]) > 0 else 0,
            store_id=str(row["store_nbr"]),
        ))
        sales_rows += 1

    db.commit()

    return {"products_created": products_created, "sales_rows": sales_rows}
