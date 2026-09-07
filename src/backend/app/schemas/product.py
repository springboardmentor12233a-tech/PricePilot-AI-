from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    product_name: str
    category: Optional[str] = None
    brand: Optional[str] = None
    base_price: float
    current_price: float
    inventory_level: Optional[int] = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True