from pydantic import BaseModel
from typing import List
from datetime import datetime

class DemandForecastItem(BaseModel):
    horizon: str
    predicted_units: float
    trend: str
    confidence_score: float
    model_used: str
    generated_at: datetime

    class Config:
        from_attributes = True

class ProductForecastResponse(BaseModel):
    product_id: int
    product_name: str
    forecasts: List[DemandForecastItem]