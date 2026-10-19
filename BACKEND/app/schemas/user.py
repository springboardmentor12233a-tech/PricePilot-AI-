import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: datetime | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    csrf_token: str | None = None
    user: UserResponse | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OtpChallengeResponse(BaseModel):
    challenge_id: uuid.UUID
    message: str = "If the credentials are valid, a verification code was sent."
    expires_in: int
    resend_after_seconds: int


class OtpVerifyRequest(BaseModel):
    challenge_id: uuid.UUID
    otp: str = Field(pattern=r"^[0-9]{6}$")


class OtpResendRequest(BaseModel):
    challenge_id: uuid.UUID


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SessionResponse(BaseModel):
    id: uuid.UUID
    login_at: datetime
    last_activity_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None
    client_ip: str | None = None
    user_agent: str | None = None
    country: str | None = None
    region: str | None = None
    city: str | None = None
    is_current: bool = False