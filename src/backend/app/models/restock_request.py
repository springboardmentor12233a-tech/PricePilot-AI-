from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class RestockRequest(Base):
    __tablename__ = "restock_requests"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending / approved / rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())