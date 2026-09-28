"""
Authentication and Role-Based Access Control (RBAC) Module for PricePilot AI
Handles password hashing (bcrypt), JWT generation/verification (PyJWT),
and FastAPI dependency guards for route protection.
"""

import os
import datetime
from typing import Optional, List, Dict, Any
import bcrypt
import jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from database import engine

JWT_SECRET = os.environ.get(
    "JWT_SECRET", "pricepilot_super_secure_jwt_secret_key_2026_x99_enterprise_safe"
)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash plaintext password using bcrypt with random salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate signed JWT token containing user claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=JWT_EXPIRATION_DAYS)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate signed JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> Dict[str, Any]:
    """
    FastAPI dependency: Enforces valid JWT token in Authorization: Bearer <token>.
    Returns the authenticated user dict from PostgreSQL.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload["sub"]
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, email, full_name, role, created_at FROM users WHERE email = :email"),
            {"email": email},
        ).mappings().first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_dict = dict(user)
    if "created_at" in user_dict and hasattr(user_dict["created_at"], "isoformat"):
        user_dict["created_at"] = user_dict["created_at"].isoformat()

    return user_dict


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency: Returns user if authenticated, or None if anonymous.
    """
    if not credentials or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None

    email = payload.get("sub")
    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("SELECT id, email, full_name, role, created_at FROM users WHERE email = :email"),
                {"email": email},
            ).mappings().first()
        if user:
            user_dict = dict(user)
            if "created_at" in user_dict and hasattr(user_dict["created_at"], "isoformat"):
                user_dict["created_at"] = user_dict["created_at"].isoformat()
            return user_dict
    except Exception:
        pass
    return None


def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency factory: Enforces specific RBAC roles (e.g. ['pricing_manager']).
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden: requires one of {allowed_roles} roles. Your role is '{user_role}'.",
            )
        return current_user

    return role_checker
