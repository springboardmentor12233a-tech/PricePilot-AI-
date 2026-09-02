from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    sub_category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    cost_price = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    target_margin = Column(Float, default=40.0)  # percentage
    stock_level = Column(Integer, default=100)
    rating = Column(Float, default=4.5)
    rating_count = Column(Integer, default=100)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    price_history = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")
    sales_records = relationship("SalesRecord", back_populates="product", cascade="all, delete-orphan")
    competitor_prices = relationship("CompetitorPrice", back_populates="product", cascade="all, delete-orphan")
