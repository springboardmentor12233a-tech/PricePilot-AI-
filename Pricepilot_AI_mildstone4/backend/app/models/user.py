from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from app.core.database import Base

class UserRole(str, Enum):
    admin = "admin"
    analyst = "analyst"
    user = "user"

class AuthProvider(str, Enum):
    email = "email"
    google = "google"
    github = "github"
    microsoft = "microsoft"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    profile_image = Column(String(500), nullable=True)
    auth_provider = Column(SAEnum(AuthProvider), default=AuthProvider.email, nullable=False)
    provider_user_id = Column(String(200), nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth users
    role = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def __repr__(self):
        return f"<User id={self.id} email={self.email} provider={self.auth_provider} role={self.role}>"

    @property
    def permissions(self):
        perms = {
            UserRole.admin: ["dashboard", "product_kpis", "price_prediction", "demand_forecast", "ai_insights", "bi_report", "eda_charts", "user_management"],
            UserRole.analyst: ["dashboard", "product_kpis", "price_prediction", "demand_forecast", "ai_insights", "bi_report", "eda_charts"],
            UserRole.user: ["dashboard", "product_kpis", "ai_insights"]
        }
        return perms.get(self.role, ["dashboard"])
