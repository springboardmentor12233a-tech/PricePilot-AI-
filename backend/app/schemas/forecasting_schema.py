from pydantic import BaseModel
from datetime import datetime


class DemandForecastItem(BaseModel):
    horizon: str
    predicted_units: float
    trend: str
    confidence_score: float
    model_used: str
    generated_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class ProductForecastResponse(BaseModel):
    product_id: int
    product_name: str
    forecasts: list[DemandForecastItem]