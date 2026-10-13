from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=8)
    role: str = "VIEWER"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Products ----------
class ProductOut(BaseModel):
    product_id: str
    product_name: str
    category: Optional[str]
    subcategory: Optional[str]
    brand: Optional[str]
    cost_price: Optional[float]
    base_price: Optional[float]
    current_price: Optional[float] = None
    rating: Optional[float]
    num_reviews: Optional[int]
    is_active: Optional[bool]

    class Config:
        from_attributes = True


# ---------- Pricing ----------
class PricePredictRequest(BaseModel):
    product_id: str


class PriceOptimizeRequest(BaseModel):
    product_id: str
    objective: str = "revenue"  # revenue | profit | demand | competitive


class ForecastRequest(BaseModel):
    product_id: str
    horizon_days: int = 30


# ---------- Reports ----------
class ReportGenerateRequest(BaseModel):
    report_type: str
    file_format: str = "pdf"  # pdf | xlsx | csv
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    product_id: Optional[str] = None
    channel: Optional[str] = None


# ---------- Chat ----------
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    tool_calls: Optional[Any] = None
