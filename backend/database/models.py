from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Text,
    Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.database.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_code = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(
        String(200),
        nullable=False
    )

    price = Column(
        Float,
        nullable=False
    )

    cost_price = Column(
        Float,
        nullable=True
    )

    stock_quantity = Column(
        Integer,
        default=0
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    category = relationship(
        "Category",
        back_populates="products"
    )
class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    invoice_no = Column(String(50), nullable=False, index=True)

    product_code = Column(
        String(100),
        ForeignKey("products.product_code"),
        nullable=False,
        index=True
    )

    quantity = Column(Integer, nullable=False)

    invoice_date = Column(DateTime, nullable=False)

    unit_price = Column(Float, nullable=False)

    customer_id = Column(
        String(50),
        nullable=True
    )

    country = Column(
        String(100),
        nullable=True
    )

    revenue = Column(
        Float,
        nullable=False
    )

    product = relationship("Product")
      

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

    product = relationship("Product")