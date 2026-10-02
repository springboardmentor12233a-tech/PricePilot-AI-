from pathlib import Path

import joblib
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.groq_service import generate_pricing_insight

router = APIRouter(prefix="/pricing", tags=["Pricing"])

ROOT = Path(__file__).resolve().parents[4]
DATA_PATH = ROOT / "data" / "PricePilot_8_Small_Datasets.xlsx"
MODEL_PATH = ROOT / "backend" / "app" / "ml" / "saved_models" / "price_prediction_model.pkl"

if not MODEL_PATH.exists():
    MODEL_PATH = ROOT / "backend" / "models" / "price_prediction_model.pkl"

model = joblib.load(MODEL_PATH)


class PricePredictionRequest(BaseModel):
    cost_price: float
    competitor_price: float
    discount_pct: float = 0
    units_sold: int
    list_price: float
    market_demand_index: float
    demand_growth_rate: float
    inflation_rate: float
    category: str
    date: str = "2026-07-29"


def prediction_frame(data: PricePredictionRequest) -> pd.DataFrame:
    dt = pd.to_datetime(data.date)

    return pd.DataFrame([{
        "cost_price": data.cost_price,
        "competitor_price": data.competitor_price,
        "units_sold": data.units_sold,
        "market_demand_index": data.market_demand_index,
        "demand_growth_rate": data.demand_growth_rate,
        "inflation_rate": data.inflation_rate,
        "year": dt.year,
        "month": dt.month,
        "day": dt.day,
        "day_of_week": dt.dayofweek,
        "category": data.category,
    }])


@router.post("/predict")
def predict_price(data: PricePredictionRequest):
    prediction = model.predict(prediction_frame(data))[0]

    return {
        "predicted_price": round(float(prediction), 2)
    }


@router.post("/insight")
def pricing_insight(data: PricePredictionRequest):
    predicted_price = round(
        float(model.predict(prediction_frame(data))[0]), 2
    )

    try:
        insight = generate_pricing_insight(
            predicted_price=predicted_price,
            cost_price=data.cost_price,
            competitor_price=data.competitor_price,
            discount_pct=data.discount_pct,
            units_sold=data.units_sold,
            list_price=data.list_price,
            market_demand_index=data.market_demand_index,
            demand_growth_rate=data.demand_growth_rate,
            inflation_rate=data.inflation_rate,
            category=data.category,
        )
    except Exception:
        insight = (
            f"Recommended price is ₹{predicted_price:,.0f}. "
            "Review competitor pricing, demand and margin before applying the change."
        )

    return {
        "predicted_price": predicted_price,
        "ai_insight": insight,
    }


@router.get("/kpis")
def get_kpis():
    sales = pd.read_excel(
        DATA_PATH,
        sheet_name="02_Historical_Sales"
    )

    products = pd.read_excel(
        DATA_PATH,
        sheet_name="01_Product_Catalog"
    )

    sales["date"] = pd.to_datetime(sales["date"])

    df = sales.merge(
        products[["product_id", "cost_price", "category"]],
        on="product_id",
        how="left",
    )

    df["profit"] = (
        df["selling_price"] - df["cost_price"]
    ) * df["units_sold"]

    monthly = (
        df.groupby(df["date"].dt.to_period("M"))
        .agg(
            revenue=("revenue", "sum"),
            profit=("profit", "sum"),
            units_sold=("units_sold", "sum"),
        )
        .reset_index()
    )

    monthly["month"] = monthly["date"].astype(str)
    monthly = monthly.drop(columns=["date"])

    category = (
        df.groupby("category")
        .agg(
            revenue=("revenue", "sum"),
            units_sold=("units_sold", "sum"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    return {
        "total_revenue": round(float(df["revenue"].sum()), 2),
        "total_units_sold": int(df["units_sold"].sum()),
        "average_selling_price": round(
            float(df["selling_price"].mean()), 2
        ),
        "total_profit": round(float(df["profit"].sum()), 2),
        "profit_margin": round(
            float(
                df["profit"].sum()
                / df["revenue"].sum()
                * 100
            ),
            2,
        ),
        "monthly": monthly.to_dict(orient="records"),
        "category": category.to_dict(orient="records"),
    }


@router.get("/market")
def get_market():
    sales = pd.read_excel(
        DATA_PATH,
        sheet_name="02_Historical_Sales"
    )

    products = pd.read_excel(
        DATA_PATH,
        sheet_name="01_Product_Catalog"
    )

    competitors = pd.read_excel(
        DATA_PATH,
        sheet_name="05_Competitor_Prices"
    )

    inventory = pd.read_excel(
        DATA_PATH,
        sheet_name="04_Inventory"
    )

    promotions = pd.read_excel(
        DATA_PATH,
        sheet_name="06_Promotions"
    )

    seasonal = pd.read_excel(
        DATA_PATH,
        sheet_name="07_Seasonal_Events"
    )

    market = pd.read_excel(
        DATA_PATH,
        sheet_name="08_Market_Economic"
    )

    sales["date"] = pd.to_datetime(sales["date"])
    competitors["date"] = pd.to_datetime(competitors["date"])
    market["date"] = pd.to_datetime(market["date"])
    seasonal["event_date"] = pd.to_datetime(
        seasonal["event_date"]
    )

    comp_avg = (
        competitors
        .groupby("product_id")["competitor_price"]
        .mean()
        .reset_index()
    )

    comp_avg = comp_avg.merge(
        products[
            [
                "product_id",
                "product_name",
                "category",
                "list_price",
            ]
        ],
        on="product_id",
    )

    own_avg = (
        sales
        .groupby("product_id")["selling_price"]
        .mean()
        .reset_index(name="our_price")
    )

    comp_avg = comp_avg.merge(
        own_avg,
        on="product_id",
        how="left",
    )

    comp_avg["price_gap_pct"] = (
        (
            comp_avg["our_price"]
            - comp_avg["competitor_price"]
        )
        / comp_avg["competitor_price"]
        * 100
    )

    comp_avg = comp_avg.sort_values(
        "price_gap_pct"
    )

    market_daily = (
        market
        .groupby("date")
        .agg(
            market_demand_index=(
                "market_demand_index",
                "mean",
            ),
            demand_growth_rate=(
                "demand_growth_rate",
                "mean",
            ),
            inflation_rate=(
                "inflation_rate",
                "mean",
            ),
            market_search_index=(
                "market_search_index",
                "mean",
            ),
        )
        .reset_index()
    )

    market_daily["date"] = (
        market_daily["date"]
        .dt.strftime("%Y-%m-%d")
    )

    promo = (
        promotions
        .groupby("promotion_type")
        .agg(
            products=("product_id", "count"),
            avg_discount=("discount_pct", "mean"),
        )
        .reset_index()
        .sort_values("products", ascending=False)
    )

    return {
        "avg_competitor_price": round(
            float(competitors["competitor_price"].mean()),
            2,
        ),
        "avg_our_price": round(
            float(sales["selling_price"].mean()),
            2,
        ),
        "avg_price_gap_pct": round(
            float(
                (
                    sales["selling_price"].mean()
                    - competitors["competitor_price"].mean()
                )
                / competitors["competitor_price"].mean()
                * 100
            ),
            2,
        ),
        "stockout_records": int(
            inventory["stockout_flag"].sum()
        ),
        "avg_closing_stock": round(
            float(inventory["closing_stock"].mean()),
            2,
        ),
        "active_promotions": int(
            promotions["promotion_active"].sum()
        ),
        "promotion_total": int(len(promotions)),
        "competitors": (
            comp_avg.head(8)
            .round(2)
            .to_dict(orient="records")
        ),
        "market_daily": (
            market_daily.tail(30)
            .round(3)
            .to_dict(orient="records")
        ),
        "promotions": (
            promo.round(2)
            .to_dict(orient="records")
        ),
        "seasonal": seasonal.to_dict(
            orient="records"
        ),
    }


@router.get("/model")
def get_model_results():
    path = (
        ROOT
        / "backend"
        / "app"
        / "ml"
        / "saved_models"
        / "model_comparison.csv"
    )

    if not path.exists():
        return {"models": []}

    df = pd.read_csv(path).round(4)

    return {
        "models": df.to_dict(
            orient="records"
        )
    }