"""
Ingests online_retail_II.xlsx into:
  - Product   (one row per unique StockCode)
  - Sale      (one row per invoice line)

WHY this file uses bulk_insert_mappings instead of db.add() in a loop
(teaching note -- IMPORTANT, this dataset is 1,067,371 rows):
The other two ingestion scripts use `db.add(...)` inside a for-loop,
which is fine for ~300K rows but becomes painfully slow past ~500K rows,
because SQLAlchemy is doing one round-trip of bookkeeping per object.
For this dataset we switch to `bulk_insert_mappings`, which sends data
to Postgres in large batches instead of row-by-row. This is a real
performance technique you'll want to remember: ORM convenience (db.add)
for small/medium data, bulk methods for large data.

We also skip rows with cancelled invoices (Invoice starting with "C")
and non-positive quantities/prices, since those represent returns/refunds,
not real sales -- including them would corrupt demand forecasting later
(a return isn't "negative demand", it needs separate handling we're not
doing in this first version).
"""

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import insert

from app.models.models import Product, Sale


def ingest_online_retail(db: Session, xlsx_path: str, sample_frac: float | None = None) -> dict:
    sheet_names = ["Year 2009-2010", "Year 2010-2011"]
    frames = [pd.read_excel(xlsx_path, sheet_name=s) for s in sheet_names]
    df = pd.concat(frames, ignore_index=True)

    # Drop cancelled invoices (Invoice code starting with "C") and bad rows
    df = df[~df["Invoice"].astype(str).str.startswith("C")]
    df = df[(df["Quantity"] > 0) & (df["Price"] > 0)]
    df = df.dropna(subset=["StockCode", "InvoiceDate"])

    if sample_frac is not None:
        df = df.sample(frac=sample_frac, random_state=42)

    # --- Step 1: create one Product per unique StockCode (bulk) ---
    unique_products = df.drop_duplicates(subset=["StockCode"])[["StockCode", "Description", "Price"]]

    product_mappings = [
        {
            "external_id": str(r["StockCode"]),
            "name": str(r["Description"])[:255] if pd.notna(r["Description"]) else str(r["StockCode"]),
            "category": None,  # this dataset has no category field
            "current_price": float(r["Price"]),
            "source_dataset": "online_retail_ii",
        }
        for _, r in unique_products.iterrows()
    ]

    db.bulk_insert_mappings(Product, product_mappings)
    db.commit()

    # Re-query to build the external_id -> Product.id lookup we need for Sale rows.
    # (bulk_insert_mappings doesn't give us back the generated IDs directly,
    # so we fetch them the same way any code would when it needs IDs that
    # were assigned by the database.)
    products = db.query(Product.id, Product.external_id).filter(
        Product.source_dataset == "online_retail_ii"
    ).all()
    product_lookup = {ext_id: pid for pid, ext_id in products}

    # --- Step 2: bulk insert Sale rows ---
    sale_mappings = []
    for _, row in df.iterrows():
        product_id = product_lookup.get(str(row["StockCode"]))
        if product_id is None:
            continue  # safety guard, should not happen
        sale_mappings.append({
            "product_id": product_id,
            "quantity": int(row["Quantity"]),
            "revenue": float(row["Quantity"]) * float(row["Price"]),
            "sale_date": row["InvoiceDate"],
            "is_holiday": 0,
            "is_promo": 0,
            "store_id": None,
        })

    # Insert in chunks so we don't try to send a million rows in one
    # single statement (Postgres and network limits both cap statement size).
    CHUNK = 5000
    for i in range(0, len(sale_mappings), CHUNK):
        db.bulk_insert_mappings(Sale, sale_mappings[i:i + CHUNK])
    db.commit()

    return {
        "products_created": len(product_mappings),
        "sales_rows": len(sale_mappings),
    }
