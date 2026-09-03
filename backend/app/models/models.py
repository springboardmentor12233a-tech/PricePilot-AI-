"""
Database models for PricePilot AI.

Mapping to the project brief (Section 4, Modules 1-7):
- User               -> Module 1: User Management Module
- Product            -> Module 2: Product & Pricing Data Module
- PriceHistory       -> Module 2 + feeds Module 3: Price Prediction
- Sale               -> Module 2 + feeds Module 4: Demand Forecasting
- CompetitorPrice    -> Module 5: Competitor Analysis Module
- DemandForecast     -> stores OUTPUT of Module 4's ML models
                        (forecast period, predicted units, trend, confidence
                        -- matches the exact output format in the PDF's
                        "Example Forecast" section: Forecast Period,
                        Predicted Demand, Demand Trend, Confidence Score)

Mapping to our 3 datasets:
- Product + PriceHistory  <- Retail Price Optimization dataset
- Sale                    <- Online Retail II + Rossmann (unified into one table)
- CompetitorPrice         <- Retail Price Optimization (comp_1/2/3 columns)
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    Matches PDF Module 1: 'Business user registration', 'Pricing manager
    accounts', 'Role management'. We keep it simple with 3 roles for now --
    easy to extend later.
    """
    ADMIN = "admin"
    PRICING_MANAGER = "pricing_manager"
    ANALYST = "analyst"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.ANALYST, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    # external_id lets us keep the original ID from whichever source dataset
    # (e.g. Retail Price Optimization's product_id, or Online Retail's
    # StockCode) without forcing a fake unified ID scheme too early.
    external_id = Column(String, index=True, nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, index=True, nullable=True)
    current_price = Column(Float, nullable=False)
    weight_g = Column(Float, nullable=True)
    source_dataset = Column(String, nullable=True)  # e.g. "retail_price_optimization"
    created_at = Column(DateTime, default=datetime.utcnow)

    price_history = relationship("PriceHistory", back_populates="product")
    sales = relationship("Sale", back_populates="product")
    competitor_prices = relationship("CompetitorPrice", back_populates="product")
    forecasts = relationship("DemandForecast", back_populates="product")


class PriceHistory(Base):
    """
    Time-series of a product's own price over time.
    Directly feeds Module 3: Price Prediction Module.
    """
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    price = Column(Float, nullable=False)
    freight_price = Column(Float, nullable=True)
    recorded_at = Column(DateTime, nullable=False, index=True)

    # Added after first model training run: lag_price (previous period's
    # price) turned out to correlate 0.994 with current price -- pricing
    # is "sticky" in the real world, so this is the single most predictive
    # feature available. qty/customers/product_score are demand-side
    # signals from the same source dataset, kept for completeness.
    lag_price = Column(Float, nullable=True)
    qty = Column(Integer, nullable=True)
    customers = Column(Integer, nullable=True)
    product_score = Column(Float, nullable=True)

    product = relationship("Product", back_populates="price_history")


class Sale(Base):
    """
    A single sales record (day-level or transaction-level, depending on
    source dataset). Feeds Module 4: Demand Forecasting Module and
    Module 6: Revenue Optimization Module.
    """
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    revenue = Column(Float, nullable=False)
    sale_date = Column(DateTime, nullable=False, index=True)
    is_holiday = Column(Integer, default=0)   # 0/1 flag - seasonal feature
    is_promo = Column(Integer, default=0)     # 0/1 flag - seasonal feature
    store_id = Column(String, nullable=True)  # populated for Rossmann-sourced rows

    product = relationship("Product", back_populates="sales")


class CompetitorPrice(Base):
    """
    Directly maps to the PDF's Module 5: Competitor Analysis Module
    (competitor price monitoring, market comparison, pricing opportunity
    detection). Sourced from comp_1/comp_2/comp_3 columns in the
    Retail Price Optimization dataset.
    """
    __tablename__ = "competitor_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    competitor_name = Column(String, nullable=False)  # e.g. "comp_1"
    price = Column(Float, nullable=False)
    recorded_at = Column(DateTime, nullable=False, index=True)

    product = relationship("Product", back_populates="competitor_prices")


class DemandForecast(Base):
    """
    Stores ML model OUTPUT. Schema intentionally mirrors the PDF's own
    "Example Forecast" output block exactly:
        Forecast Period, Predicted Demand, Demand Trend, Confidence Score
    so that Module 7's dashboard can query and display it with no
    transformation needed.
    """
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    horizon = Column(String, nullable=False)       # "7d" | "14d" | "30d" | "3m" | "6m" | "12m"
    predicted_units = Column(Float, nullable=False)
    trend = Column(String, nullable=False)          # "Increasing" | "Stable" | "Decreasing"
    confidence_score = Column(Float, nullable=False)  # 0-100
    model_used = Column(String, nullable=True)       # "Prophet" | "XGBoost" | etc.
    generated_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="forecasts")
