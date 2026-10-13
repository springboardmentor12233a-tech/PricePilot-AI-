"""
SQLAlchemy models for PricePilot AI.

Tables: users, roles, products, daily_operations, customer_activity,
competitor_prices, price_predictions, demand_forecasts, competitor_analysis,
pricing_recommendations, ai_alerts, ai_insights, reports, chat_sessions,
chat_messages, audit_logs.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer,
    String, Text, JSON, UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship

from app.database.db import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    BUSINESS_MANAGER = "BUSINESS_MANAGER"
    BUSINESS_ANALYST = "BUSINESS_ANALYST"
    VIEWER = "VIEWER"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    product_id = Column(String, primary_key=True)
    product_name = Column(String, nullable=False)
    category = Column(String, index=True)
    subcategory = Column(String)
    brand = Column(String)
    cost_price = Column(Float)
    base_price = Column(Float)
    currency = Column(String, default="USD")
    launch_date = Column(Date)
    weight_kg = Column(Float)
    rating = Column(Float)
    num_reviews = Column(Integer)
    is_active = Column(Boolean, default=True)


class DailyOperation(Base):
    __tablename__ = "daily_operations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, index=True, nullable=False)
    product_id = Column(String, ForeignKey("products.product_id"), index=True, nullable=False)
    category = Column(String, index=True)
    list_price = Column(Float)
    discount_pct = Column(Float)
    final_price = Column(Float)
    units_sold = Column(Integer)
    revenue = Column(Float)
    channel = Column(String)
    stock_available = Column(Integer)
    restocked = Column(Boolean)
    stockout_flag = Column(Boolean)
    warehouse = Column(String)
    competitor_avg_price = Column(Float)
    competitor_min_price = Column(Float)
    day_of_week = Column(String)
    is_weekend = Column(Boolean)
    is_holiday = Column(Boolean)
    holiday_name = Column(String)
    is_festival_season = Column(Boolean)
    festival_name = Column(String)
    is_promotional_event = Column(Boolean)
    promotional_event_name = Column(String)
    market_demand_index = Column(Float)
    inflation_rate_pct = Column(Float)
    consumer_confidence_index = Column(Float)

    __table_args__ = (Index("ix_dailyops_product_date", "product_id", "date"),)


class CustomerActivity(Base):
    __tablename__ = "customer_activity"

    event_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, index=True)
    order_id = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime, index=True)
    customer_id = Column(String, index=True)
    customer_segment = Column(String)
    product_id = Column(String, ForeignKey("products.product_id"), index=True)
    category = Column(String)
    event_type = Column(String, index=True)  # view | add_to_cart | purchase
    device = Column(String)
    channel = Column(String)
    price_shown = Column(Float)
    quantity = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    payment_method = Column(String, nullable=True)


class CompetitorPrice(Base):
    __tablename__ = "competitor_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, index=True)
    product_id = Column(String, ForeignKey("products.product_id"), index=True)
    competitor_name = Column(String, index=True)
    competitor_price = Column(Float)
    in_stock = Column(Boolean)

    __table_args__ = (Index("ix_competitor_product_date", "product_id", "date"),)


class PricePrediction(Base):
    __tablename__ = "price_predictions"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.product_id"), index=True)
    requested_by = Column(String, ForeignKey("users.id"), nullable=True)
    objective = Column(String)  # revenue | profit | demand | competitive
    current_price = Column(Float)
    recommended_price = Column(Float)
    price_change_pct = Column(Float)
    expected_demand = Column(Float)
    expected_revenue = Column(Float)
    expected_profit = Column(Float)
    model_used = Column(String)
    model_mae = Column(Float)
    model_rmse = Column(Float)
    model_r2 = Column(Float)
    explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.product_id"), index=True)
    horizon_days = Column(Integer)
    model_used = Column(String)
    forecast_json = Column(JSON)  # list of {date, predicted_demand, lower, upper}
    trend = Column(String)  # Increasing | Stable | Decreasing
    confidence_score = Column(Float)
    confidence_label = Column(String)
    confidence_reason = Column(Text)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PricingRecommendation(Base):
    __tablename__ = "pricing_recommendations"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.product_id"), index=True)
    title = Column(String)
    category = Column(String)
    priority = Column(String)  # LOW | MEDIUM | HIGH
    reason = Column(Text)
    supporting_metrics = Column(JSON)
    recommendation = Column(Text)
    expected_impact = Column(Text)
    confidence = Column(Float)
    source = Column(String)  # groq | gemini | deterministic
    created_at = Column(DateTime, default=datetime.utcnow)


class AIAlert(Base):
    __tablename__ = "ai_alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.product_id"), nullable=True)
    alert_type = Column(String)
    severity = Column(String)  # INFO | WARNING | CRITICAL
    title = Column(String)
    message = Column(Text)
    metrics = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, default=gen_uuid)
    scope = Column(String)  # global | product | category
    scope_id = Column(String, nullable=True)
    content = Column(Text)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    report_type = Column(String)
    generated_by = Column(String, ForeignKey("users.id"), nullable=True)
    filters = Column(JSON)
    file_format = Column(String)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, default="New conversation")
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"), index=True)
    role = Column(String)  # user | assistant
    content = Column(Text)
    tool_calls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, index=True)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
