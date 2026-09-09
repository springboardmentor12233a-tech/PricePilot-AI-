from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import pickle
import pandas as pd
import os

router = APIRouter(prefix="/predictions", tags=["Predictions"])

# Load models once when the server starts
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "ml_models")

price_model = joblib.load(os.path.join(MODELS_DIR, "price_prediction_model.pkl"))
demand_model = joblib.load(os.path.join(MODELS_DIR, "demand_forecast_model_final.pkl"))
encoders = joblib.load(os.path.join(MODELS_DIR, "label_encoders.pkl"))

with open(os.path.join(MODELS_DIR, "prophet_demand_model.pkl"), "rb") as f:
    prophet_model = pickle.load(f)


class PriceRecommendationRequest(BaseModel):
    category: str
    brand: str
    region: str
    channel: str
    season: str
    base_price: float
    inventory_level: int
    month: int
    day_of_week: int


@router.post("/recommend-price")
def recommend_price(request: PriceRecommendationRequest):
    try:
        category_enc = encoders['category'].transform([request.category])[0]
        brand_enc = encoders['brand'].transform([request.brand])[0]
        region_enc = encoders['region'].transform([request.region])[0]
        channel_enc = encoders['channel'].transform([request.channel])[0]
        season_enc = encoders['season'].transform([request.season])[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Unknown category value: {str(e)}")

    scenarios = []
    for discount in range(0, 55, 5):
        current_price = request.base_price * (1 - discount / 100)

        demand_features = pd.DataFrame([{
            'category': category_enc,
            'brand': brand_enc,
            'region': region_enc,
            'channel': channel_enc,
            'season': season_enc,
            'base_price': request.base_price,
            'discount_pct': discount,
            'inventory_level': request.inventory_level,
            'month': request.month,
            'day_of_week': request.day_of_week
        }])

        predicted_demand = float(demand_model.predict(demand_features)[0])
        projected_revenue = current_price * predicted_demand

        scenarios.append({
            "discount_pct": discount,
            "price": round(current_price, 2),
            "predicted_units_sold": round(predicted_demand, 1),
            "projected_revenue": round(projected_revenue, 2)
        })

    best = max(scenarios, key=lambda x: x["projected_revenue"])

    return {
        "scenarios": scenarios,
        "recommended": best
    }


@router.get("/demand-forecast")
def demand_forecast(days: int = 30):
    if days not in [7, 14, 30, 90, 365]:
        raise HTTPException(status_code=400, detail="days must be one of: 7, 14, 30, 90, 365")

    future = prophet_model.make_future_dataframe(periods=days)
    forecast = prophet_model.predict(future)

    forecast_tail = forecast.tail(days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

    recent_avg = forecast_tail['yhat'].tail(min(15, days)).mean()
    earlier_data = forecast['yhat'].iloc[-(days + 15):-days] if len(forecast) > days + 15 else forecast['yhat'].head(15)
    earlier_avg = earlier_data.mean()

    pct_change = ((recent_avg - earlier_avg) / earlier_avg) * 100 if earlier_avg != 0 else 0

    if pct_change > 5:
        trend = "Increasing Demand"
    elif pct_change < -5:
        trend = "Decreasing Demand"
    else:
        trend = "Stable Demand"

    forecast_data = [
        {
            "date": row['ds'].strftime("%Y-%m-%d"),
            "predicted_units": round(row['yhat'], 1),
            "lower_bound": round(row['yhat_lower'], 1),
            "upper_bound": round(row['yhat_upper'], 1)
        }
        for _, row in forecast_tail.iterrows()
    ]

    return {
        "horizon_days": days,
        "trend": trend,
        "change_pct": round(pct_change, 1),
        "forecast": forecast_data
    }