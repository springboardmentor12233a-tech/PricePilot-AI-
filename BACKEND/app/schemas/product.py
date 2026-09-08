import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, ConfigDict


class ProductVariantBase(BaseModel):
    name: str
    sku: str
    barcode: str | None = None
    attributes: dict[str, Any] = {}
    cost_price: Decimal | None = None
    price: Decimal | None = None


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    name: str | None = None
    barcode: str | None = None
    attributes: dict[str, Any] | None = None
    cost_price: Decimal | None = None
    price: Decimal | None = None
    is_active: bool | None = None


class ProductVariantResponse(ProductVariantBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    is_active: bool
    created_at: datetime


class ProductBase(BaseModel):
    name: str
    sku: str
    brand: str | None = None
    description: str | None = None
    cost_price: Decimal | None = None
    base_price: Decimal
    currency: str = "INR"
    is_active: bool = True


class ProductCreate(ProductBase):
    organization_id: uuid.UUID
    category_id: uuid.UUID | None = None
    slug: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: uuid.UUID | None = None
    brand: str | None = None
    description: str | None = None
    cost_price: Decimal | None = None
    base_price: Decimal | None = None
    currency: str | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    category_id: uuid.UUID | None = None
    slug: str
    created_at: datetime
    updated_at: datetime


class InventoryUpdate(BaseModel):
    quantity_on_hand: int | None = None
    reserved_quantity: int | None = None
    reorder_level: int | None = None
    reorder_quantity: int | None = None


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    quantity_on_hand: int
    reserved_quantity: int
    reorder_level: int
    reorder_quantity: int | None = None
    available_quantity: int
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime
