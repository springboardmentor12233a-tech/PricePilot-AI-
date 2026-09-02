import os
import pandas as pd
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.product import Product
from app.models.pricing import PriceHistory
from app.models.competitor import CompetitorPrice
from app.models.sales import SalesRecord
from app.core.security import get_password_hash

DATA_DIR = r"C:\Users\jojo\.gemini\antigravity\scratch\pricepilot-ai\data"
PROCESSED_FILE = os.path.join(DATA_DIR, "processed", "integrated_pricing_demand_dataset.csv")

def seed_database(db: Session):
    print("Checking database seeding status...")
    
    # 1. Seed Demo Users if none exist
    if db.query(User).count() == 0:
        print("Seeding default demo accounts...")
        demo_users = [
            User(
                email="manager@pricepilot.ai",
                username="Sarah Connor",
                hashed_password=get_password_hash("Manager@123"),
                role="pricing_manager"
            ),
            User(
                email="analyst@pricepilot.ai",
                username="David Chen",
                hashed_password=get_password_hash("Analyst@123"),
                role="business_analyst"
            ),
            User(
                email="admin@pricepilot.ai",
                username="Elena Rostova",
                hashed_password=get_password_hash("Admin@123"),
                role="admin"
            )
        ]
        db.add_all(demo_users)
        db.commit()
        print(" -> Demo accounts created (manager@pricepilot.ai, analyst@pricepilot.ai, admin@pricepilot.ai)")

    # 2. Seed Products and Sales from integrated dataset
    if db.query(Product).count() == 0 and os.path.exists(PROCESSED_FILE):
        print(f"Seeding products & sales data from {PROCESSED_FILE}...")
        df = pd.read_csv(PROCESSED_FILE)
        
        # Unique products
        unique_prods = df.drop_duplicates(subset=["product_id"])
        product_map = {}

        for _, row in unique_prods.iterrows():
            prod = Product(
                sku=str(row["product_id"]),
                name=str(row["product_name"]),
                category=str(row["category"]),
                sub_category=str(row["sub_category"]),
                description=f"High performance {row['category']} product designed for {row['sub_category']}.",
                cost_price=float(row["cost_price"]),
                base_price=float(row["base_msrp"]),
                current_price=float(row["current_price"]),
                min_price=round(float(row["cost_price"]) * 1.15, 2),  # 15% min margin guardrail
                max_price=round(float(row["base_msrp"]) * 1.30, 2),  # 30% max markup guardrail
                target_margin=45.0,
                stock_level=int(row["stock_level"]),
                rating=float(row["product_rating"]),
                rating_count=int(row["rating_count"])
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
            product_map[row["product_id"]] = prod.id

            # Initial price history
            db.add(PriceHistory(
                product_id=prod.id,
                old_price=float(row["base_msrp"]),
                new_price=float(row["current_price"]),
                change_reason="Initial Baseline Price",
                changed_by="Pricing Engine"
            ))

            # Competitor prices
            db.add_all([
                CompetitorPrice(product_id=prod.id, competitor_name="Amazon / TechMart", competitor_price=float(row["competitor_1_price"])),
                CompetitorPrice(product_id=prod.id, competitor_name="Walmart Retail", competitor_price=float(row["competitor_2_price"])),
                CompetitorPrice(product_id=prod.id, competitor_name="Target Stores", competitor_price=float(row["competitor_3_price"])),
            ])
            db.commit()

        # Seed Sales Records (sample 2,000 for fast DB indexing)
        sales_records = []
        for _, row in df.sample(min(2500, len(df)), random_state=42).iterrows():
            pid = product_map.get(row["product_id"])
            if pid:
                sales_records.append(SalesRecord(
                    product_id=pid,
                    units_sold=int(row["units_sold"]),
                    unit_price=float(row["current_price"]),
                    discount_pct=float(row["discount_pct"]),
                    revenue=float(row["revenue"]),
                    gross_profit=float(row["gross_profit"]),
                    is_promotion=bool(row["is_promotion"]),
                    is_holiday=bool(row["is_holiday"]),
                    is_weekend=bool(row["is_weekend"]),
                    sales_channel=str(row["sales_channel"]),
                    recorded_date=str(row["date"])
                ))
        
        db.bulk_save_objects(sales_records)
        db.commit()
        print(f" -> Successfully seeded {len(product_map)} products and {len(sales_records)} sales records into database!")
