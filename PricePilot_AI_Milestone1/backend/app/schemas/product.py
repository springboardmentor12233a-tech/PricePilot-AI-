from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.pricing import PriceHistoryResponse, CompetitorPriceResponse

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    cost_price: float
    base_price: float
    current_price: float
    min_price: float
    max_price: float
    target_margin: float = 40.0
    stock_level: int = 100

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = None
    base_price: Optional[float] = None
    current_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    target_margin: Optional[float] = None
    stock_level: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    rating: float
    rating_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    margin_pct: Optional[float] = None
    competitor_avg: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class ProductDetailResponse(ProductResponse):
    price_history: List[PriceHistoryResponse] = []
    competitor_prices: List[CompetitorPriceResponse] = []
