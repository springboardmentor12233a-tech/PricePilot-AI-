from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PriceUpdateRequest(BaseModel):
    new_price: float
    change_reason: str = "Manual Adjustment"

class PriceHistoryResponse(BaseModel):
    id: int
    product_id: int
    old_price: float
    new_price: float
    change_reason: str
    changed_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompetitorPriceResponse(BaseModel):
    id: int
    competitor_name: str
    competitor_price: float
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)
