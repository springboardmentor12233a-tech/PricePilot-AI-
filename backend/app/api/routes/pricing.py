"""
Price Prediction API endpoint (PDF Module 3).

This is intentionally a thin layer: validate the request (Pydantic does
this automatically), call the ML logic, return the response. Business
logic lives in app/ml/predict_price.py, not here.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.pricing import PricePredictionRequest, PricePredictionResponse
from app.ml.predict_price import predict_price

router = APIRouter(prefix="/api/pricing", tags=["Pricing"])


@router.post("/predict", response_model=PricePredictionResponse)
def predict(req: PricePredictionRequest):
    try:
        price = predict_price(req)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return PricePredictionResponse(predicted_price=round(price, 2))