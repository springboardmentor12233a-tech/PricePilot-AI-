from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KPIOverview(BaseModel):
    total_products: int
    active_skus: int
    total_revenue: float
    total_units_sold: int
    total_gross_profit: float
    avg_profit_margin_pct: float
    recent_price_changes_count: int

class RevenueTrendPoint(BaseModel):
    date: str
    revenue: float
    units_sold: int
    gross_profit: float

class CategoryBreakdown(BaseModel):
    category: str
    revenue: float
    units_sold: int
    gross_profit: float
    margin_pct: float
    product_count: int

class RecentPriceActivity(BaseModel):
    id: int
    product_id: int
    product_name: str
    category: str
    old_price: float
    new_price: float
    price_diff: float
    change_reason: str
    changed_by: str
    created_at: str
