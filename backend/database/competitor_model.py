from sqlalchemy import Column, Integer, String, Float, ForeignKey
from backend.database.database import Base


class CompetitorPrice(Base):
    __tablename__ = "competitor_prices"

    id = Column(Integer, primary_key=True, index=True)

    product_code = Column(
        String(100),
        ForeignKey("products.product_code"),
        nullable=False,
        index=True
    )

    competitor_name = Column(
        String(100),
        nullable=False
    )

    competitor_price = Column(
        Float,
        nullable=False
    )