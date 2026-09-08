import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import CompetitorStatus


class CompetitorBase(BaseModel):
    name: str
    website: str | None = None


class CompetitorCreate(CompetitorBase):
    organization_id: uuid.UUID


class CompetitorUpdate(BaseModel):
    name: str | None = None
    website: str | None = None
    status: CompetitorStatus | None = None
    is_active: bool | None = None


class CompetitorResponse(CompetitorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    status: CompetitorStatus
    is_active: bool
    created_at: datetime


class CompetitorProductCreate(BaseModel):
    competitor_id: uuid.UUID
    product_id: uuid.UUID
    name: str
    url: str | None = None
    sku: str | None = None
    match_confidence: Decimal | None = None


class CompetitorProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    competitor_id: uuid.UUID
    product_id: uuid.UUID
    name: str
    url: str | None = None
    sku: str | None = None
    match_confidence: Decimal | None = None
    created_at: datetime


class CompetitorPriceCreate(BaseModel):
    competitor_product_id: uuid.UUID
    price: Decimal
    currency: str = "INR"
    availability: bool = True


class CompetitorPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    competitor_product_id: uuid.UUID
    price: Decimal
    currency: str
    availability: bool
    scraped_at: datetime
