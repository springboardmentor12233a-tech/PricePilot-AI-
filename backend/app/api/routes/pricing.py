from app.services.groq_service import generate_pricing_insight
from pathlib import Path

import joblib
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/pricing", tags=["Pricing"])


MODEL_PATH = Path(__file__).resolve().parents[3] / "models" / "price_prediction_model.pkl"

model = joblib.load(MODEL_PATH)


class PricePredictionRequest(BaseModel):
    cost_price: float
    competitor_price: float
    discount_pct: float
    units_sold: int
    list_price: float
    market_demand_index: float
    demand_growth_rate: float
    inflation_rate: float
    category: str


@router.post("/predict")
def predict_price(data: PricePredictionRequest):

    input_data = pd.DataFrame([{
        "cost_price": data.cost_price,
        "competitor_price": data.competitor_price,
        "discount_pct": data.discount_pct,
        "units_sold": data.units_sold,
        "list_price": data.list_price,
        "market_demand_index": data.market_demand_index,
        "demand_growth_rate": data.demand_growth_rate,
        "inflation_rate": data.inflation_rate,
        "category": data.category
    }])

    prediction = model.predict(input_data)[0]

    return {
        "predicted_price": round(float(prediction), 2)
    }

@router.post("/insight")
def pricing_insight(data: PricePredictionRequest):

    input_data = pd.DataFrame([{
        "cost_price": data.cost_price,
        "competitor_price": data.competitor_price,
        "discount_pct": data.discount_pct,
        "units_sold": data.units_sold,
        "list_price": data.list_price,
        "market_demand_index": data.market_demand_index,
        "demand_growth_rate": data.demand_growth_rate,
        "inflation_rate": data.inflation_rate,
        "category": data.category
    }])

    prediction = model.predict(input_data)[0]
    predicted_price = round(float(prediction), 2)

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
        category=data.category
    )

    return {
        "predicted_price": predicted_price,
        "ai_insight": insight
    }

@router.get("/kpis")
def get_kpis():

    
    data_path = Path(__file__).resolve().parents[4] / "data" / "PricePilot_8_Small_Datasets.xlsx"

    sales = pd.read_excel(data_path, sheet_name="02_Historical_Sales")
    products = pd.read_excel(data_path, sheet_name="01_Product_Catalog")

    df = sales.merge(
        products[["product_id", "cost_price", "category"]],
        on="product_id",
        how="left"
    )

    df["profit"] = (df["selling_price"] - df["cost_price"]) * df["units_sold"]
    df["date"] = pd.to_datetime(df["date"])

    monthly = (
        df.groupby(df["date"].dt.to_period("M"))
        .agg(
            revenue=("revenue", "sum"),
            profit=("profit", "sum")
        )
        .reset_index()
    )

    monthly["month"] = monthly["date"].astype(str)
    monthly = monthly.drop(columns=["date"])

    category = (
        df.groupby("category")
        .agg(
            revenue=("revenue", "sum"),
            units_sold=("units_sold", "sum")
        )
        .reset_index()
    )

    return {
        "total_revenue": round(float(df["revenue"].sum()), 2),
        "total_units_sold": int(df["units_sold"].sum()),
        "average_selling_price": round(float(df["selling_price"].mean()), 2),
        "total_profit": round(float(df["profit"].sum()), 2),
        "monthly": monthly.to_dict(orient="records"),
        "category": category.to_dict(orient="records")
    }