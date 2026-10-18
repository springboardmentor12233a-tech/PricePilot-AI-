import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import RecommendationStatus


class PriceHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    old_price: Decimal
    new_price: Decimal
    change_reason: str | None = None
    changed_by_user_id: uuid.UUID | None = None
    created_at: datetime


class PricingPredictionInput(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    target_margin_percent: float | None = Field(
        default=20.0, ge=0, le=1000, allow_inf_nan=False
    )


class PricingPredictionOutput(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    current_price: Decimal = Field(gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    recommended_price: Decimal = Field(gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    competitor_avg_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    demand_factor: str | None = "stable"
    recommendation_reason: str
    price_change_percentage: float


class PricingRecommendationCreate(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    current_price: Decimal = Field(gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    recommended_price: Decimal = Field(gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    competitor_avg_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    demand_factor: str | None = None
    recommendation_reason: str | None = None


class PricingRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    current_price: Decimal = Field(gt=0)
    recommended_price: Decimal = Field(gt=0)
    competitor_avg_price: Decimal | None = Field(default=None, gt=0)
    demand_factor: str | None = None
    recommendation_reason: str | None = None
    status: RecommendationStatus
    created_at: datetime
