"""
PricePilot AI — User Management & RBAC Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = "Store Merchandising"
    is_active: bool = True
    status: str = "ACTIVE"
    createdDate: Optional[str] = None
    lastActive: Optional[str] = "Never"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=4)
    role: str = Field(default="USER")
    department: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    is_active: Optional[bool] = True


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class StatusUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    status: Optional[str] = None


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=4)
    department: Optional[str] = "Store Merchandising"
    role: Optional[str] = "USER"
