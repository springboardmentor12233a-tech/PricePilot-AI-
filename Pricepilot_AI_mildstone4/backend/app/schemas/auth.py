from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole, AuthProvider

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[UserRole] = UserRole.user

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    profile_image: Optional[str] = None
    auth_provider: AuthProvider
    provider_user_id: Optional[str] = None
    role: UserRole
    permissions: List[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    message: str = "Authentication successful"

class OAuthUrlResponse(BaseModel):
    provider: str
    authorization_url: str

class ProductCreateRequest(BaseModel):
    name: str
    category: str
    price: float
    cost: float
    competitor_1: Optional[float] = None
    competitor_2: Optional[float] = None
    competitor_3: Optional[float] = None
    daily_demand: Optional[float] = 30.0
    stock: Optional[int] = 500
    sales_channel: Optional[str] = "Direct Web"
    rating: Optional[float] = 4.5
    status: Optional[str] = "Optimal"

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    competitor_1: Optional[float] = None
    competitor_2: Optional[float] = None
    competitor_3: Optional[float] = None
    daily_demand: Optional[float] = None
    stock: Optional[int] = None
    sales_channel: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float
    cost: float
    competitor_1: Optional[float] = None
    competitor_2: Optional[float] = None
    competitor_3: Optional[float] = None
    competitor_avg: float
    margin_pct: float
    daily_demand: float
    stock: int
    sales_channel: str
    rating: float
    annual_revenue: float
    status: str
