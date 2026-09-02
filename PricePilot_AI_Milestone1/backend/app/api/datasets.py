import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/datasets", tags=["Dataset Integration & Preprocessing"])

DATA_DIR = r"C:\Users\jojo\.gemini\antigravity\scratch\pricepilot-ai\data"
PROCESSED_FILE = os.path.join(DATA_DIR, "processed", "integrated_pricing_demand_dataset.csv")
RAW_DIR = os.path.join(DATA_DIR, "raw")

@router.get("/summary")
def get_dataset_summary(current_user: User = Depends(get_current_user)):
    datasets_info = []
    
    # 1. Master dataset
    if os.path.exists(PROCESSED_FILE):
        df_master = pd.read_csv(PROCESSED_FILE)
        datasets_info.append({
            "name": "PricePilot Unified Master Dataset",
            "type": "Processed & Integrated",
            "source": "4-Kaggle Hybrid Synthesis",
            "row_count": len(df_master),
            "column_count": len(df_master.columns),
            "columns": list(df_master.columns),
            "date_range": f"{df_master['date'].min()} to {df_master['date'].max()}",
            "status": "Active & Integrated"
        })
    
    # 2. Raw datasets
    raw_files = {
        "amazon_product_pricing.csv": ("Amazon / Flipkart Product Pricing Dataset", "Catalog & MSRP Baselines"),
        "retail_price_optimization.csv": ("Retail Price Optimization Dataset", "Competitor Feeds & Price Elasticity"),
        "favorita_store_sales.csv": ("Favorita Store Sales Dataset", "Time-Series Daily Demand & Seasonality"),
        "brazilian_ecommerce_olist.csv": ("Brazilian E-Commerce Dataset (Olist)", "Multi-Channel Orders & Reviews")
    }

    for fname, (dname, desc) in raw_files.items():
        fpath = os.path.join(RAW_DIR, fname)
        if os.path.exists(fpath):
            df_raw = pd.read_csv(fpath)
            datasets_info.append({
                "name": dname,
                "type": "Raw Ingested",
                "source": "Kaggle",
                "row_count": len(df_raw),
                "column_count": len(df_raw.columns),
                "columns": list(df_raw.columns),
                "description": desc,
                "status": "Loaded"
            })

    return {
        "status": "healthy",
        "total_datasets": len(datasets_info),
        "datasets": datasets_info
    }

@router.get("/preview")
def preview_dataset(dataset_type: str = "master", limit: int = 10, current_user: User = Depends(get_current_user)):
    if dataset_type == "master":
        fpath = PROCESSED_FILE
    else:
        fpath = os.path.join(RAW_DIR, f"{dataset_type}.csv")
        
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Dataset file not found")

    df = pd.read_csv(fpath)
    return {
        "dataset": dataset_type,
        "total_rows": len(df),
        "preview": df.head(limit).to_dict(orient="records")
    }
