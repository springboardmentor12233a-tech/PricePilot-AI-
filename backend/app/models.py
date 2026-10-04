"""
Pydantic schemas and database models for PricePilot AI.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.core.database import Base


# ==========================================
# SQLAlchemy ORM Models (Stored in SQLite)
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="analyst")  # "admin", "analyst", "viewer"
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False, index=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class DismissedAlert(Base):
    __tablename__ = "dismissed_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, nullable=False, index=True)
    user_email = Column(String, nullable=False)
    dismissed_at = Column(DateTime, default=datetime.utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Integer, default=0)


class ProductDB(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    current_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0.0)
    competitor_price = Column(Float, nullable=False, default=0.0)
    comp_2 = Column(Float, nullable=True)
    comp_3 = Column(Float, nullable=True)
    units_sold = Column(Integer, default=0)
    revenue_this_month = Column(Float, default=0.0)
    revenue_last_month = Column(Float, default=0.0)
    stock_level = Column(Integer, default=100)
    stock_status = Column(String, default="In Stock")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Compatibility aliases for legacy imports
Product = ProductDB


# ==========================================
# Pydantic Schemas (API Requests / Responses)
# ==========================================

# --- Auth Schemas ---

class UserLoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime


class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Literal["admin", "analyst", "viewer"] = "analyst"


class RoleUpdateRequest(BaseModel):
    role: Literal["admin", "analyst", "viewer"]


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


# --- Product & Pricing Schemas ---

ALLOWED_CATEGORIES = [
    "Audio",
    "Laptops",
    "Smartphones",
    "Displays & TVs",
    "Tablets",
    "Cameras",
    "computers_accessories",
    "consoles_games",
    "Accessories",
    "Electronics",
]

class ProductCreate(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=150)
    category: str
    current_price: float = Field(..., gt=0)
    cost_price: Optional[float] = Field(None, gt=0)
    competitor_price: Optional[float] = Field(None, gt=0)
    comp_2: Optional[float] = None
    comp_3: Optional[float] = None
    stock_level: Optional[int] = Field(100, ge=0)
    stock_status: Optional[str] = "In Stock"

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in ALLOWED_CATEGORIES:
            # If not exact match, check case-insensitive match
            for allowed in ALLOWED_CATEGORIES:
                if v.lower() == allowed.lower():
                    return allowed
            raise ValueError(f"Category '{v}' not allowed. Must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    category: Optional[str] = None
    current_price: Optional[float] = Field(None, gt=0)
    cost_price: Optional[float] = Field(None, gt=0)
    competitor_price: Optional[float] = Field(None, gt=0)
    comp_2: Optional[float] = None
    comp_3: Optional[float] = None
    stock_level: Optional[int] = Field(None, ge=0)
    stock_status: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_CATEGORIES:
            for allowed in ALLOWED_CATEGORIES:
                if v.lower() == allowed.lower():
                    return allowed
            raise ValueError(f"Category '{v}' not allowed. Must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return v


class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    current_price: float
    recommended_price: float
    price_gap_pct: float
    cost_price: float
    competitor_price: float
    comp_2: Optional[float] = None
    comp_3: Optional[float] = None
    units_sold: int
    revenue_this_month: float
    revenue_last_month: float
    stock_level: int
    stock_status: str
    predicted_revenue: float
    price_trend: str
    demand_trend: str
    confidence_score: float
    elasticity_coef: float
    llm_summary: str


class PricingSweepPoint(BaseModel):
    price: float
    predicted_demand: int
    predicted_revenue: float
    margin_pct: float


class PricingSweepResponse(BaseModel):
    product_id: str
    product_name: str
    current_price: float
    recommended_price: float
    cost_price: float
    competitor_price: float
    price_gap_pct: float
    elasticity_coef: float
    optimal_price: float
    optimal_demand: int
    optimal_revenue: float
    explanation: Optional[str] = None
    sweep: List[PricingSweepPoint]


class OptimizePriceRequest(BaseModel):
    product_id: str
    custom_price: float = Field(..., gt=0)


class OptimizePriceResponse(BaseModel):
    product_id: str
    custom_price: float
    current_price: float
    predicted_demand: int
    predicted_revenue: float
    revenue_delta: float
    margin_pct: float


# --- Demand Forecasting Schemas ---

class ForecastHistoryPoint(BaseModel):
    period: str
    actual_demand: int
    revenue: float


class ForecastFuturePoint(BaseModel):
    period: str
    forecasted_demand: int
    lower_ci: int
    upper_ci: int
    predicted_revenue: float


class ProductForecastResponse(BaseModel):
    product_id: str
    product_name: str
    category: str
    current_price: float
    demand_trend: str  # Increasing, Decreasing, Stable
    confidence_score: float
    r_squared: float
    model_type: str
    slope: float
    horizon_days: int = 30
    confidence_explanation: str
    history: List[ForecastHistoryPoint]
    forecast: List[ForecastFuturePoint]


# --- AI Insights & Recommendations ---

class StructuredRecommendation(BaseModel):
    action: Literal["reduce price", "increase price", "hold", "investigate"]
    recommended_price: float
    reasoning: str
    urgency: Literal["low", "medium", "high"]
    expected_impact: str


class ProductInsightResponse(BaseModel):
    product_id: str
    product_name: str
    llm_summary: str
    recommendation: StructuredRecommendation
    source: str  # "groq" or "deterministic-engine"


class ChatQueryRequest(BaseModel):
    question: str
    context_product_id: Optional[str] = None


class ChatQueryResponse(BaseModel):
    answer: str
    source: str  # "local-rule-engine" or "groq-llm"
    suggestions: List[str] = []


# --- Alerts Schemas ---

class AlertItem(BaseModel):
    alert_id: str
    product_id: str
    product_name: str
    category: str
    severity: Literal["low", "medium", "high", "critical"]
    type: str  # "PRICE_GAP", "LOW_CONFIDENCE", "DEMAND_DROP", "CRITICAL_STOCK"
    title: str
    message: str
    suggested_action: str
    timestamp: datetime
    metrics: Dict[str, Any]


# --- KPI Overview Schema ---

class KPIOverview(BaseModel):
    total_monthly_revenue: float
    revenue_growth_pct: float
    total_units_sold: int
    units_growth_pct: float
    avg_price_gap_pct: float
    potential_revenue_lift: float
    total_products: int
    high_urgency_alerts: int
    model_avg_confidence: float
