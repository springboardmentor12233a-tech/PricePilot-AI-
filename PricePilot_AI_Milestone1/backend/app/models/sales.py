from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    units_sold = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_pct = Column(Float, default=0.0)
    revenue = Column(Float, nullable=False)
    gross_profit = Column(Float, nullable=False)
    is_promotion = Column(Boolean, default=False)
    is_holiday = Column(Boolean, default=False)
    is_weekend = Column(Boolean, default=False)
    sales_channel = Column(String, default="Direct Web Store")
    recorded_date = Column(String, index=True, nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="sales_records")
