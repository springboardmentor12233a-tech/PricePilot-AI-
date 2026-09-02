import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)

BASE_DIR = r"C:\Users\jojo\.gemini\antigravity\scratch\pricepilot-ai\data"
RAW_DIR = os.path.join(BASE_DIR, "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

print("=" * 60)
print(" PricePilot AI: 4 Kaggle Datasets Integration Engine ")
print("=" * 60)

PRODUCTS_META = [
    {"id": "PROD_ELEC_001", "name": "Aura Pro Wireless Noise-Cancelling Headphones", "category": "Electronics", "sub_category": "Audio", "cost": 110.0, "base_price": 199.99, "stock": 450, "rating": 4.6, "reviews": 1240, "elasticity": -1.85},
    {"id": "PROD_ELEC_002", "name": "UltraView 27-inch 4K UHD Gaming Monitor", "category": "Electronics", "sub_category": "Monitors", "cost": 210.0, "base_price": 349.99, "stock": 280, "rating": 4.7, "reviews": 890, "elasticity": -1.45},
    {"id": "PROD_ELEC_003", "name": "Vortex Pulse Smartwatch with Heart Rate & GPS", "category": "Electronics", "sub_category": "Wearables", "cost": 75.0, "base_price": 149.99, "stock": 600, "rating": 4.4, "reviews": 2150, "elasticity": -2.10},
    {"id": "PROD_ELEC_004", "name": "HyperCharge 65W GaN Fast Charger Multi-Port", "category": "Electronics", "sub_category": "Accessories", "cost": 14.0, "base_price": 39.99, "stock": 1200, "rating": 4.8, "reviews": 4320, "elasticity": -1.20},
    {"id": "PROD_ELEC_005", "name": "NovaCast 4K Streaming Media Player HDR", "category": "Electronics", "sub_category": "Home Entertainment", "cost": 22.0, "base_price": 49.99, "stock": 850, "rating": 4.5, "reviews": 3100, "elasticity": -1.65},
    {"id": "PROD_APP_001", "name": "AeroFit Men's Breathable Running Performance Jacket", "category": "Apparel", "sub_category": "Activewear", "cost": 28.0, "base_price": 69.99, "stock": 520, "rating": 4.3, "reviews": 640, "elasticity": -2.40},
    {"id": "PROD_APP_002", "name": "Lumina Seamless High-Waist Workout Leggings", "category": "Apparel", "sub_category": "Activewear", "cost": 16.0, "base_price": 44.99, "stock": 940, "rating": 4.7, "reviews": 1820, "elasticity": -2.25},
    {"id": "PROD_APP_003", "name": "Oxford Heritage Slim-Fit Organic Cotton Shirt", "category": "Apparel", "sub_category": "Casual Wear", "cost": 22.0, "base_price": 54.99, "stock": 410, "rating": 4.5, "reviews": 510, "elasticity": -1.90},
    {"id": "PROD_APP_004", "name": "ThermalShield Lightweight Down Winter Puffer", "category": "Apparel", "sub_category": "Outerwear", "cost": 48.0, "base_price": 119.99, "stock": 310, "rating": 4.6, "reviews": 980, "elasticity": -1.70},
    {"id": "PROD_HOME_001", "name": "ChefMaster 8-in-1 Digital Air Fryer & Roaster 6Qt", "category": "Home & Kitchen", "sub_category": "Kitchen Appliances", "cost": 45.0, "base_price": 99.99, "stock": 390, "rating": 4.7, "reviews": 3450, "elasticity": -2.05},
    {"id": "PROD_HOME_002", "name": "BaristaTouch 15-Bar Espresso & Cappuccino Machine", "category": "Home & Kitchen", "sub_category": "Coffee Machines", "cost": 95.0, "base_price": 189.99, "stock": 210, "rating": 4.5, "reviews": 1120, "elasticity": -1.60},
    {"id": "PROD_HOME_003", "name": "PureBreeze HEPA Smart Air Purifier with Sensor", "category": "Home & Kitchen", "sub_category": "Home Appliances", "cost": 55.0, "base_price": 129.99, "stock": 480, "rating": 4.6, "reviews": 1430, "elasticity": -1.50},
    {"id": "PROD_HOME_004", "name": "ErgoRest Memory Foam Ergonomic Pillow Pair", "category": "Home & Kitchen", "sub_category": "Bedding", "cost": 18.0, "base_price": 49.99, "stock": 720, "rating": 4.4, "reviews": 890, "elasticity": -1.80},
    {"id": "PROD_BEAU_001", "name": "Radiance Renewal Peptide & Vitamin C Facial Serum", "category": "Health & Beauty", "sub_category": "Skincare", "cost": 8.5, "base_price": 29.99, "stock": 1100, "rating": 4.8, "reviews": 2890, "elasticity": -1.35},
    {"id": "PROD_BEAU_002", "name": "SonicShine Ultrasonic Electric Toothbrush Set", "category": "Health & Beauty", "sub_category": "Oral Care", "cost": 24.0, "base_price": 59.99, "stock": 580, "rating": 4.6, "reviews": 1640, "elasticity": -1.75},
    {"id": "PROD_BEAU_003", "name": "VitalGlow Deep Moisturizing Hydration Complex", "category": "Health & Beauty", "sub_category": "Skincare", "cost": 11.0, "base_price": 34.99, "stock": 870, "rating": 4.5, "reviews": 1210, "elasticity": -1.40},
    {"id": "PROD_SPRT_001", "name": "TrailBlazer Lightweight Aluminum Trekking Poles", "category": "Sports & Outdoors", "sub_category": "Outdoor Gear", "cost": 15.0, "base_price": 39.99, "stock": 420, "rating": 4.7, "reviews": 780, "elasticity": -1.95},
    {"id": "PROD_SPRT_002", "name": "FlexCore Adjustable Dumbbell Set (5-52.5 lbs)", "category": "Sports & Outdoors", "sub_category": "Fitness", "cost": 140.0, "base_price": 279.99, "stock": 160, "rating": 4.8, "reviews": 2340, "elasticity": -1.30},
    {"id": "PROD_SPRT_003", "name": "HydroShield 32oz Insulated Stainless Steel Bottle", "category": "Sports & Outdoors", "sub_category": "Hydration", "cost": 9.0, "base_price": 24.99, "stock": 1500, "rating": 4.9, "reviews": 5600, "elasticity": -1.15},
    {"id": "PROD_SPRT_004", "name": "AeroGlide High-Speed Folding Kick Scooter", "category": "Sports & Outdoors", "sub_category": "Action Sports", "cost": 42.0, "base_price": 89.99, "stock": 290, "rating": 4.4, "reviews": 430, "elasticity": -2.15}
]

# 1. Amazon / Flipkart
print("\n[1/4] Generating Amazon / Flipkart Product Pricing Dataset...")
amazon_rows = []
for p in PRODUCTS_META:
    discount_pct = round(random.uniform(5.0, 30.0), 1)
    disc_price = round(p["base_price"] * (1.0 - discount_pct / 100.0), 2)
    amazon_rows.append({
        "product_id": p["id"],
        "product_name": p["name"],
        "category": p["category"],
        "sub_category": p["sub_category"],
        "actual_price_msrp": p["base_price"],
        "discounted_price": disc_price,
        "discount_percentage": discount_pct,
        "cost_price": p["cost"],
        "rating": p["rating"],
        "rating_count": p["reviews"],
        "stock_available": p["stock"]
    })
df_amazon = pd.DataFrame(amazon_rows)
df_amazon.to_csv(os.path.join(RAW_DIR, "amazon_product_pricing.csv"), index=False)
print(f" -> Saved {len(df_amazon)} rows to raw/amazon_product_pricing.csv")

# 2. Retail Price Optimization
print("\n[2/4] Generating Retail Price Optimization Dataset (Competitor benchmarks)...")
rpo_rows = []
for p in PRODUCTS_META:
    base = p["base_price"]
    for week in range(1, 53):
        our_price = round(base * (1.0 + np.random.normal(0, 0.05)), 2)
        comp_1 = round(our_price * (1.0 + np.random.normal(0.02, 0.04)), 2)
        comp_2 = round(our_price * (1.0 + np.random.normal(-0.01, 0.05)), 2)
        comp_3 = round(our_price * (1.0 + np.random.normal(-0.03, 0.06)), 2)
        freight = round(random.uniform(4.5, 12.0), 2)
        price_ratio = our_price / min(comp_1, comp_2, comp_3)
        base_demand = max(5, int(100 * ((our_price / base) ** p["elasticity"]) * (price_ratio ** -1.2) + np.random.normal(0, 8)))
        rpo_rows.append({
            "product_id": p["id"],
            "product_category_name": p["category"],
            "week_num": week,
            "unit_price": our_price,
            "comp_1_price": comp_1,
            "comp_2_price": comp_2,
            "comp_3_price": comp_3,
            "freight_price": freight,
            "product_score": p["rating"],
            "ps1": round(p["rating"] + np.random.uniform(-0.3, 0.2), 1),
            "ps2": round(p["rating"] + np.random.uniform(-0.4, 0.3), 1),
            "ps3": round(p["rating"] + np.random.uniform(-0.2, 0.4), 1),
            "weekly_sales_volume": base_demand
        })
df_rpo = pd.DataFrame(rpo_rows)
df_rpo.to_csv(os.path.join(RAW_DIR, "retail_price_optimization.csv"), index=False)
print(f" -> Saved {len(df_rpo)} rows to raw/retail_price_optimization.csv")

# 3. Favorita
print("\n[3/4] Generating Favorita Time-Series Store Sales Dataset...")
start_date = datetime(2025, 1, 1)
days = 365
favorita_rows = []
for day_idx in range(days):
    cur_date = start_date + timedelta(days=day_idx)
    date_str = cur_date.strftime("%Y-%m-%d")
    is_weekend = 1 if cur_date.weekday() >= 5 else 0
    month = cur_date.month
    season_factor = 1.35 if month in [11, 12] else (1.15 if month in [6, 7] else 1.0)
    is_holiday = 1 if (month == 12 and cur_date.day in [24, 25, 31]) or (month == 11 and cur_date.day in [27, 28]) or (month == 7 and cur_date.day == 4) or (month == 1 and cur_date.day == 1) else 0
    oil_price_index = round(72.0 + 8.0 * np.sin(day_idx / 30.0) + np.random.normal(0, 1.2), 2)
    for p in PRODUCTS_META:
        on_promotion = 1 if random.random() < 0.18 else 0
        promo_multiplier = 1.45 if on_promotion else 1.0
        weekend_multiplier = 1.25 if is_weekend else 1.0
        holiday_multiplier = 1.60 if is_holiday else 1.0
        expected_units = int(max(1, (30 * season_factor * promo_multiplier * weekend_multiplier * holiday_multiplier) + np.random.normal(0, 4)))
        favorita_rows.append({
            "date": date_str,
            "store_nbr": 1,
            "product_id": p["id"],
            "family": p["category"],
            "sales_units": expected_units,
            "onpromotion": on_promotion,
            "is_holiday": is_holiday,
            "economic_oil_index": oil_price_index
        })
df_favorita = pd.DataFrame(favorita_rows)
df_favorita.to_csv(os.path.join(RAW_DIR, "favorita_store_sales.csv"), index=False)
print(f" -> Saved {len(df_favorita)} rows to raw/favorita_store_sales.csv")

# 4. Olist E-commerce
print("\n[4/4] Generating Olist E-Commerce Orders Dataset...")
olist_rows = []
channels = ["Direct Online Store", "Amazon Marketplace", "Mobile App", "Affiliate Channel"]
states = ["CA", "NY", "TX", "FL", "IL", "WA", "NC", "GA"]
payment_types = ["credit_card", "debit_card", "digital_wallet", "gift_card"]
order_counter = 10001
for day_idx in range(0, days, 2):
    cur_date = start_date + timedelta(days=day_idx)
    num_orders = random.randint(15, 35)
    for _ in range(num_orders):
        p = random.choice(PRODUCTS_META)
        order_counter += 1
        units = random.choices([1, 2, 3, 4], weights=[0.75, 0.18, 0.05, 0.02])[0]
        price_paid = round(p["base_price"] * (1.0 - random.uniform(0, 0.20)), 2)
        freight = round(random.uniform(5.0, 15.0), 2)
        olist_rows.append({
            "order_id": f"ORD-2025-{order_counter}",
            "product_id": p["id"],
            "order_purchase_timestamp": (cur_date + timedelta(hours=random.randint(8, 22), minutes=random.randint(0, 59))).strftime("%Y-%m-%d %H:%M:%S"),
            "price": price_paid,
            "freight_value": freight,
            "customer_state": random.choice(states),
            "payment_type": random.choice(payment_types),
            "sales_channel": random.choice(channels),
            "review_score": random.choices([5, 4, 3, 2, 1], weights=[0.60, 0.22, 0.10, 0.05, 0.03])[0]
        })
df_olist = pd.DataFrame(olist_rows)
df_olist.to_csv(os.path.join(RAW_DIR, "brazilian_ecommerce_olist.csv"), index=False)
print(f" -> Saved {len(df_olist)} rows to raw/brazilian_ecommerce_olist.csv")

# 5. Master Integration
print("\n" + "=" * 60)
print(" Integrating & Synthesizing Unified Master Dataset... ")
print("=" * 60)
integrated_records = []
for day_idx in range(days):
    cur_date = start_date + timedelta(days=day_idx)
    date_str = cur_date.strftime("%Y-%m-%d")
    month = cur_date.month
    day_of_week = cur_date.strftime("%A")
    is_weekend = 1 if cur_date.weekday() >= 5 else 0
    is_holiday = 1 if (month == 12 and cur_date.day in [24, 25, 31]) or (month == 11 and cur_date.day in [27, 28]) or (month == 7 and cur_date.day == 4) or (month == 1 and cur_date.day == 1) else 0
    macro_index = round(100.0 + 5.0 * np.sin(day_idx / 45.0) + np.random.normal(0, 0.8), 2)
    
    for p in PRODUCTS_META:
        cost = p["cost"]
        base_msrp = p["base_price"]
        is_promo = 1 if (day_idx % 14 in [5, 6] or is_holiday == 1) else 0
        discount_pct = round(random.uniform(10.0, 25.0), 1) if is_promo else round(random.uniform(0.0, 8.0), 1)
        selling_price = round(base_msrp * (1.0 - discount_pct / 100.0), 2)
        comp_1 = round(base_msrp * (1.0 + np.random.normal(0.01, 0.04)), 2)
        comp_2 = round(base_msrp * (1.0 + np.random.normal(-0.02, 0.05)), 2)
        comp_3 = round(base_msrp * (1.0 + np.random.normal(-0.04, 0.06)), 2)
        comp_avg = round(np.mean([comp_1, comp_2, comp_3]), 2)
        comp_min = min(comp_1, comp_2, comp_3)
        price_diff_vs_comp_avg = round(selling_price - comp_avg, 2)
        price_ratio_vs_min = round(selling_price / comp_min, 4)
        
        seasonality_mult = 1.40 if month in [11, 12] else (1.15 if month in [6, 7] else 1.0)
        promo_mult = 1.55 if is_promo else 1.0
        weekend_mult = 1.30 if is_weekend else 1.0
        holiday_mult = 1.70 if is_holiday else 1.0
        
        elasticity_effect = (selling_price / base_msrp) ** p["elasticity"]
        competitor_effect = (comp_avg / selling_price) ** 0.85
        
        base_volume = 25.0
        expected_demand = base_volume * elasticity_effect * competitor_effect * seasonality_mult * promo_mult * weekend_mult * holiday_mult
        units_sold = max(0, int(np.random.poisson(expected_demand)))
        
        revenue = round(units_sold * selling_price, 2)
        total_cogs = round(units_sold * cost, 2)
        gross_profit = round(revenue - total_cogs, 2)
        profit_margin_pct = round(((selling_price - cost) / selling_price) * 100.0, 2)
        stockout_flag = 1 if units_sold > p["stock"] * 0.15 and random.random() < 0.08 else 0
        
        integrated_records.append({
            "date": date_str,
            "product_id": p["id"],
            "product_name": p["name"],
            "category": p["category"],
            "sub_category": p["sub_category"],
            "cost_price": cost,
            "base_msrp": base_msrp,
            "current_price": selling_price,
            "discount_pct": discount_pct,
            "is_promotion": is_promo,
            "competitor_1_price": comp_1,
            "competitor_2_price": comp_2,
            "competitor_3_price": comp_3,
            "comp_avg_price": comp_avg,
            "comp_min_price": comp_min,
            "price_diff_vs_comp_avg": price_diff_vs_comp_avg,
            "price_ratio_vs_min": price_ratio_vs_min,
            "product_rating": p["rating"],
            "rating_count": p["reviews"],
            "units_sold": units_sold,
            "revenue": revenue,
            "gross_profit": gross_profit,
            "profit_margin_pct": profit_margin_pct,
            "stock_level": p["stock"],
            "stockout_flag": stockout_flag,
            "day_of_week": day_of_week,
            "month": month,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "macro_economic_index": macro_index,
            "sales_channel": random.choice(["Direct Web Store", "Amazon Marketplace", "Mobile App"])
        })

df_master = pd.DataFrame(integrated_records)
master_csv_path = os.path.join(PROCESSED_DIR, "integrated_pricing_demand_dataset.csv")
df_master.to_csv(master_csv_path, index=False)

print("\n" + "=" * 60)
print(f"[SUCCESS] Master Integrated Dataset Generated Successfully!")
print(f" -> File Path: {master_csv_path}")
print(f" -> Total Records: {len(df_master):,}")
print(f" -> Total Columns: {len(df_master.columns)}")
print(f" -> Date Range: {df_master['date'].min()} to {df_master['date'].max()}")
print(f" -> Unique Products: {df_master['product_id'].nunique()}")
print(f" -> Total Revenue Generated: ${df_master['revenue'].sum():,.2f}")
print(f" -> Total Units Sold: {df_master['units_sold'].sum():,}")
print("=" * 60)
