"""
PricePilot AI — Authentication Routes
======================================
Endpoints for user login, identity resolution (/api/auth/me), and safe user registration.
"""

from datetime import datetime, timezone
import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import EmailStr

from backend.app.auth import create_access_token, get_current_active_user
from backend.app.database import users_collection
from backend.app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from backend.app.schemas.user import RegisterRequest, UserResponse
from backend.app.security import hash_password, verify_password

log = logging.getLogger("pricepilot_auth_routes")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """
    Authenticate user with corporate email and password.
    Returns JWT access token with user details (excluding password_hash).
    """
    normalized_email = req.email.strip().lower()

    # Search user case-insensitively in MongoDB
    user = users_collection.find_one({"email": {"$regex": f"^{normalized_email}$", "$options": "i"}})
    if not user:
        log.warning("Login failed: Unknown user '%s'", normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check account active state
    if not user.get("is_active", True):
        log.warning("Login failed: Deactivated user '%s'", normalized_email)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact an administrator.",
        )

    # Password hash verification
    pwd_hash = user.get("password_hash")
    # If legacy plain password exists and no hash, verify and migrate safely
    if not pwd_hash and user.get("password"):
        if req.password == user.get("password"):
            # Update to secure hash
            pwd_hash = hash_password(req.password)
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"password_hash": pwd_hash}, "$unset": {"password": ""}}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    elif not pwd_hash or not verify_password(req.password, pwd_hash):
        log.warning("Login failed: Invalid password for '%s'", normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT
    user_role = (user.get("role") or "USER").upper()
    token_payload = {
        "sub": user["email"],
        "role": user_role,
    }
    access_token = create_access_token(token_payload)

    # Update lastActive timestamp
    now_iso = datetime.now(timezone.utc).isoformat()
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"lastActive": "Just now", "updated_at": now_iso}})

    user_info = UserInfo(
        id=str(user["_id"]),
        name=user.get("name", normalized_email.split("@")[0].title()),
        email=user["email"],
        role=user_role,
        department=user.get("department", "Store Merchandising"),
        status="ACTIVE" if user.get("is_active", True) else "INACTIVE",
        is_active=user.get("is_active", True),
    )

    log.info("User '%s' logged in successfully as %s", user["email"], user_role)
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_info,
    )


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """
    Retrieve authenticated user profile based on the JWT Bearer token.
    """
    return UserInfo(
        id=str(current_user["_id"]),
        name=current_user.get("name", current_user["email"].split("@")[0].title()),
        email=current_user["email"],
        role=(current_user.get("role") or "USER").upper(),
        department=current_user.get("department", "Store Merchandising"),
        status="ACTIVE" if current_user.get("is_active", True) else "INACTIVE",
        is_active=current_user.get("is_active", True),
    )


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """
    Self-service registration endpoint for new users.
    Enforces that public registrations are ALWAYS assigned the 'USER' role to prevent privilege escalation.
    """
    normalized_email = req.email.strip().lower()

    existing = users_collection.find_one({"email": {"$regex": f"^{normalized_email}$", "$options": "i"}})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    now_utc = datetime.now(timezone.utc)
    hashed = hash_password(req.password)

    # Allow USER or BUSINESS_ANALYST for self-registration (ADMIN remains restricted to invite/admin creation)
    requested_role = (req.role or "USER").upper().strip()
    if requested_role not in ["USER", "BUSINESS_ANALYST"]:
        requested_role = "USER"

    new_user = {
        "name": req.name.strip(),
        "email": normalized_email,
        "role": requested_role,
        "password_hash": hashed,
        "department": req.department or "Store Merchandising",
        "is_active": True,
        "status": "ACTIVE",
        "createdDate": now_utc.strftime("%Y-%m-%d"),
        "created_at": now_utc.isoformat(),
        "lastActive": "Just now",
        "updated_at": now_utc.isoformat(),
    }

    result = users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id

    # Generate JWT
    token_payload = {
        "sub": new_user["email"],
        "role": requested_role,
    }
    access_token = create_access_token(token_payload)

    user_info = UserInfo(
        id=str(new_user["_id"]),
        name=new_user["name"],
        email=new_user["email"],
        role=requested_role,
        department=new_user["department"],
        status="ACTIVE",
        is_active=True,
    )

    log.info("Registered new user '%s' with %s role", new_user["email"], requested_role)
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_info,
    )
