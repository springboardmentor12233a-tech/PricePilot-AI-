import pandas as pd
from sqlalchemy.orm import Session
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from backend.database.database import SessionLocal
from backend.database.models import Product, Category, Sale


FILE_PATH = "data/Online Retail.xlsx"


def import_data():
    print("Reading Excel file...")

    df = pd.read_excel(
        FILE_PATH,
        sheet_name="Online Retail"
    )

    print(f"Original rows: {len(df):,}")

    # --------------------------------------------------
    # 1. CLEAN DATA
    # --------------------------------------------------

    df = df.drop_duplicates()

    # Remove invalid quantities
    df = df[df["Quantity"] > 0]

    # Remove invalid prices
    df = df[df["UnitPrice"] > 0]

    # Remove rows without product information
    df = df.dropna(
        subset=["StockCode", "Description"]
    )

    # Convert date
    df["InvoiceDate"] = pd.to_datetime(
        df["InvoiceDate"]
    )

    print(f"Rows after cleaning: {len(df):,}")

    # --------------------------------------------------
    # 2. CONNECT TO DATABASE
    # --------------------------------------------------

    db: Session = SessionLocal()

    try:

        # --------------------------------------------------
        # 3. CREATE DEFAULT CATEGORY
        # --------------------------------------------------

        category = (
            db.query(Category)
            .filter(Category.name == "General")
            .first()
        )

        if not category:
            category = Category(
                name="General",
                description="General product category"
            )

            db.add(category)
            db.commit()
            db.refresh(category)

        print(f"Category ID: {category.id}")

        # --------------------------------------------------
        # 4. CREATE PRODUCTS
        # --------------------------------------------------

        products_created = 0

        unique_products = (
            df[
                ["StockCode", "Description", "UnitPrice"]
            ]
            .drop_duplicates(
                subset=["StockCode"]
            )
        )

        print(
            f"Unique products found: "
            f"{len(unique_products):,}"
        )

        for _, row in unique_products.iterrows():

            product_code = str(
                row["StockCode"]
            ).strip()

            existing_product = (
                db.query(Product)
                .filter(
                    Product.product_code
                    == product_code
                )
                .first()
            )

            if existing_product:
                continue

            product = Product(
                product_code=product_code,
                name=str(row["Description"]).strip(),
                price=float(row["UnitPrice"]),
                cost_price=None,
                stock_quantity=0,
                category_id=category.id
            )

            db.add(product)
            products_created += 1

        db.commit()

        print(
            f"Products created: "
            f"{products_created:,}"
        )

        # --------------------------------------------------
        # 5. CREATE SALES
        # --------------------------------------------------

        sales_created = 0

        print("Importing sales...")

        for _, row in df.iterrows():

            product_code = str(
                row["StockCode"]
            ).strip()

            revenue = (
                float(row["Quantity"])
                * float(row["UnitPrice"])
            )

            sale = Sale(
                invoice_no=str(
                    row["InvoiceNo"]
                ),
                product_code=product_code,
                quantity=int(
                    row["Quantity"]
                ),
                invoice_date=row["InvoiceDate"],
                unit_price=float(
                    row["UnitPrice"]
                ),
                customer_id=(
                    str(row["CustomerID"])
                    if pd.notna(
                        row["CustomerID"]
                    )
                    else None
                ),
                country=(
                    str(row["Country"])
                    if pd.notna(
                        row["Country"]
                    )
                    else None
                ),
                revenue=revenue
            )

            db.add(sale)
            sales_created += 1

            # Commit every 5000 rows
            if sales_created % 5000 == 0:
                db.commit()

                print(
                    f"Imported "
                    f"{sales_created:,} sales..."
                )

        db.commit()

        print()
        print("==============================")
        print("IMPORT COMPLETED")
        print("==============================")
        print(
            f"Products created: "
            f"{products_created:,}"
        )
        print(
            f"Sales created: "
            f"{sales_created:,}"
        )

    except Exception as e:

        db.rollback()

        print()
        print("IMPORT FAILED")
        print(e)

    finally:
        db.close()


if __name__ == "__main__":
    import_data()