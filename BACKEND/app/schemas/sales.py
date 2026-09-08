import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class SalesRecordCreate(BaseModel):
    organization_id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    quantity: int = 1
    unit_price: Decimal | None = None


class SalesRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    quantity: int
    unit_price: Decimal
    total_amount: Decimal
    sale_date: datetime
    created_at: datetime


class SalesAnalyticsResponse(BaseModel):
    total_sales_count: int
    total_revenue: Decimal
    units_sold: int
    average_order_value: Decimal
