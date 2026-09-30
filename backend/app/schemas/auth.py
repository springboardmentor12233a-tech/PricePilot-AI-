"""
PricePilot AI — Authentication & RBAC Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserInfo(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    is_active: bool = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
