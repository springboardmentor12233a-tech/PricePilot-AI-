from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class DemandForecastItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    horizon: str
    predicted_units: float
    trend: str
    confidence_score: float
    model_used: str
    generated_at: datetime


class ProductForecastResponse(BaseModel):
    product_id: int
    product_name: str
    forecasts: List[DemandForecastItem]