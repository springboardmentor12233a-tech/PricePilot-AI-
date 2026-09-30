"""
PricePilot AI — JWT Authentication & Role-Based Authorization (RBAC)
=====================================================================
Provides token issuance, JWT verification, and FastAPI dependency guards
for multi-role access control (ADMIN, BUSINESS_ANALYST, USER).
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from backend.app.config import settings
from backend.app.database import users_collection

log = logging.getLogger("pricepilot_auth")

# HTTP Bearer token security scheme (auto_error=True handles 403/401 nicely)
security = HTTPBearer(auto_error=False)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generate a signed JWT access token.
    Standard payload includes:
        - "sub": user email (string)
        - "role": user role (ADMIN, BUSINESS_ANALYST, USER)
        - "exp": timestamp of token expiration
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.
    Raises HTTPException(401) on invalid signature, malformed token, or expiration.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        return payload
    except JWTError as exc:
        log.warning("JWT verification failed: %s", str(exc))
        raise credentials_exception from exc


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    """
    FastAPI dependency extracting and verifying the Bearer token from the request.
    Fetches active user record from MongoDB users_collection.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_access_token(token)
    email: str = payload.get("sub", "").strip().lower()

    try:
        user = users_collection.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
    except Exception as exc:
        log.warning("MongoDB lookup failed in get_current_user (%s); using verified JWT token claims.", exc)
        user = None

    if not user:
        role = payload.get("role")
        if role:
            return {
                "id": f"token_{email}",
                "email": email,
                "role": role,
                "is_active": True,
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Normalize id for serializability
    user["id"] = str(user["_id"])
    return user



async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ensures that the authenticated user account is active.
    """
    is_active = current_user.get("is_active", True)
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled",
        )
    return current_user


def require_roles(*allowed_roles: str) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces that current_user has one of the allowed roles.
    Example: Depends(require_roles("ADMIN", "BUSINESS_ANALYST"))
    """
    normalized_roles = [r.upper() for r in allowed_roles]

    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_active_user),
    ) -> Dict[str, Any]:
        user_role = (current_user.get("role") or "").upper()
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(normalized_roles)}. Your role: {user_role}",
            )
        return current_user

    return role_checker


# Convenient role shortcut dependencies
require_admin = require_roles("ADMIN")
require_analyst_or_admin = require_roles("ADMIN", "BUSINESS_ANALYST")
require_any_authenticated = get_current_active_user


async def require_business_user(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Allow business intelligence APIs only to analysts and standard users."""
    user_role = (current_user.get("role") or "").upper()
    if user_role not in {"BUSINESS_ANALYST", "USER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business intelligence access is not available to administrator accounts.",
        )
    return current_user
