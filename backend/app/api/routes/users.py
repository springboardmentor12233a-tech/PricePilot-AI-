"""
PricePilot AI — User Management API
====================================
Administrative endpoints for managing users, roles (ADMIN, BUSINESS_ANALYST, USER),
account activation/deactivation, and credentials.
All endpoints require ADMIN role authorization.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.auth import require_admin
from backend.app.database import users_collection
from backend.app.schemas.user import (
    CreateUserRequest,
    StatusUpdateRequest,
    UpdateUserRequest,
    UserResponse,
)
from backend.app.security import hash_password

log = logging.getLogger("pricepilot_users_routes")

router = APIRouter(prefix="/users", tags=["User Management"])

VALID_ROLES = {"ADMIN", "BUSINESS_ANALYST", "USER"}


def _serialize_user_doc(doc: Dict[str, Any]) -> UserResponse:
    """Helper to convert MongoDB user document into a safe UserResponse (no password_hash)."""
    is_active = doc.get("is_active", True)
    status_str = "ACTIVE" if is_active else "INACTIVE"
    created_dt = doc.get("createdDate") or (
        doc.get("created_at")[:10] if doc.get("created_at") else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    return UserResponse(
        id=str(doc["_id"]),
        name=doc.get("name", "User"),
        email=doc.get("email", ""),
        role=(doc.get("role") or "USER").upper(),
        department=doc.get("department") or "Store Merchandising",
        is_active=is_active,
        status=status_str,
        createdDate=created_dt,
        lastActive=doc.get("lastActive", "Never"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _check_admin_safeguard(target_user_id: ObjectId):
    """
    Ensures an operation does not remove or deactivate the only active administrator.
    """
    target = users_collection.find_one({"_id": target_user_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_admin = (target.get("role") or "").upper() == "ADMIN"
    is_active = target.get("is_active", True)

    if is_admin and is_active:
        active_admins_count = users_collection.count_documents({
            "role": "ADMIN",
            "is_active": True,
        })
        if active_admins_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation rejected: Cannot delete, deactivate, or demote the only active administrator.",
            )


@router.get("", response_model=List[UserResponse])
async def list_users(current_admin: Dict[str, Any] = Depends(require_admin)):
    """
    List all platform users without exposing passwords or password hashes.
    Restricted to ADMIN users.
    """
    users = list(users_collection.find({}, {"password_hash": 0, "password": 0}).sort("created_at", -1))
    return [_serialize_user_doc(u) for u in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    req: CreateUserRequest,
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """
    Create a new user account with specified role.
    Passwords are automatically hashed and never stored in plaintext.
    Restricted to ADMIN users.
    """
    normalized_email = req.email.strip().lower()
    role_upper = req.role.strip().upper()

    if role_upper not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{req.role}'. Valid roles are: {', '.join(sorted(VALID_ROLES))}",
        )

    # Check email uniqueness
    existing = users_collection.find_one({"email": {"$regex": f"^{normalized_email}$", "$options": "i"}})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with email '{normalized_email}' already exists.",
        )

    now_utc = datetime.now(timezone.utc)
    is_active_val = req.is_active if req.is_active is not None else (req.status != "INACTIVE")

    new_user_doc = {
        "name": req.name.strip(),
        "email": normalized_email,
        "role": role_upper,
        "password_hash": hash_password(req.password),
        "department": req.department or (
            "Pricing Strategy & Platform Ops" if role_upper == "ADMIN"
            else "Merchandising & Pricing" if role_upper == "BUSINESS_ANALYST"
            else "Store Merchandising"
        ),
        "is_active": is_active_val,
        "status": "ACTIVE" if is_active_val else "INACTIVE",
        "createdDate": now_utc.strftime("%Y-%m-%d"),
        "created_at": now_utc.isoformat(),
        "lastActive": "Never",
        "updated_at": now_utc.isoformat(),
    }

    result = users_collection.insert_one(new_user_doc)
    new_user_doc["_id"] = result.inserted_id

    log.info("Admin '%s' created user '%s' (%s)", current_admin["email"], normalized_email, role_upper)
    return _serialize_user_doc(new_user_doc)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    req: UpdateUserRequest,
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """
    Update user profile details, role, department, status, or reset password.
    Restricted to ADMIN users.
    """
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")

    target = users_collection.find_one({"_id": obj_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_fields: Dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    if req.name is not None and req.name.strip():
        update_fields["name"] = req.name.strip()

    if req.email is not None and req.email.strip():
        new_email = req.email.strip().lower()
        if new_email != target.get("email", "").lower():
            # Check for conflict
            duplicate = users_collection.find_one({
                "email": {"$regex": f"^{new_email}$", "$options": "i"},
                "_id": {"$ne": obj_id},
            })
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{new_email}' is already in use by another user.",
                )
            update_fields["email"] = new_email

    if req.role is not None:
        new_role = req.role.strip().upper()
        if new_role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{req.role}'. Valid roles are: {', '.join(sorted(VALID_ROLES))}",
            )
        # If changing role away from ADMIN, ensure admin safeguard
        if (target.get("role") or "").upper() == "ADMIN" and new_role != "ADMIN":
            _check_admin_safeguard(obj_id)
        update_fields["role"] = new_role

    if req.department is not None:
        update_fields["department"] = req.department.strip()

    if req.is_active is not None:
        if not req.is_active:
            _check_admin_safeguard(obj_id)
        update_fields["is_active"] = req.is_active
        update_fields["status"] = "ACTIVE" if req.is_active else "INACTIVE"
    elif req.status is not None:
        is_act = req.status.upper() == "ACTIVE"
        if not is_act:
            _check_admin_safeguard(obj_id)
        update_fields["is_active"] = is_act
        update_fields["status"] = "ACTIVE" if is_act else "INACTIVE"

    if req.password is not None and req.password.strip():
        update_fields["password_hash"] = hash_password(req.password.strip())
        # Ensure legacy plaintext password field is removed if present
        users_collection.update_one({"_id": obj_id}, {"$unset": {"password": ""}})

    users_collection.update_one({"_id": obj_id}, {"$set": update_fields})
    updated_doc = users_collection.find_one({"_id": obj_id})
    log.info("Admin '%s' updated user '%s'", current_admin["email"], target.get("email"))
    return _serialize_user_doc(updated_doc)


@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    req: StatusUpdateRequest,
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """
    Activate or deactivate a user account.
    Prevents deactivating the only active administrator.
    Restricted to ADMIN users.
    """
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")

    target = users_collection.find_one({"_id": obj_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_is_active: bool
    if req.is_active is not None:
        new_is_active = req.is_active
    elif req.status is not None:
        new_is_active = req.status.upper() == "ACTIVE"
    else:
        # Toggle current status
        new_is_active = not target.get("is_active", True)

    if not new_is_active:
        _check_admin_safeguard(obj_id)

    status_str = "ACTIVE" if new_is_active else "INACTIVE"
    users_collection.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "is_active": new_is_active,
                "status": status_str,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    updated_doc = users_collection.find_one({"_id": obj_id})
    log.info("Admin '%s' changed user '%s' status to %s", current_admin["email"], target.get("email"), status_str)
    return _serialize_user_doc(updated_doc)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """
    Delete a user account.
    Prevents removing the only active administrator.
    Restricted to ADMIN users.
    """
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")

    target = users_collection.find_one({"_id": obj_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    _check_admin_safeguard(obj_id)

    users_collection.delete_one({"_id": obj_id})
    log.info("Admin '%s' deleted user '%s'", current_admin["email"], target.get("email"))
    return {"message": "User deleted successfully", "id": user_id, "email": target.get("email")}
