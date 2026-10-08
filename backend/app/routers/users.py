"""
User Management & RBAC Governance Router.
Provides Admin-only endpoints mounted at /api/users for role updates and activations/deactivations.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    User,
    UserResponse,
    RoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.services.auth import require_role, log_audit

router = APIRouter(prefix="/api/users", tags=["User Governance & RBAC"])


@router.get("", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: List all users in system.
    """
    return db.query(User).order_by(User.id.asc()).all()


@router.patch("/{user_id}/role", response_model=UserResponse)
@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Change a user's access role.
    Admin cannot remove their own Admin role (returns 400).
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == current_user.id and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot remove your own Admin role.",
        )

    old_role = target_user.role
    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)

    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="ROLE_UPDATED",
        details=f"Admin {current_user.email} changed {target_user.email} role from '{old_role}' to '{payload.role}'",
        request=request,
    )

    return target_user


@router.patch("/{user_id}/status", response_model=UserResponse)
@router.patch("/{user_id}", response_model=UserResponse)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdateRequest,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Activate or deactivate a user, or change their role.
    Admin cannot deactivate or demote themselves (returns 400).
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    is_active_val = payload.is_active
    if is_active_val is None and payload.status is not None:
        is_active_val = payload.status.lower() in ("active", "true", "1")

    if is_active_val is False and target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own Admin account.",
        )

    old_active = target_user.is_active
    if is_active_val is not None:
        target_user.is_active = is_active_val

    if payload.role:
        if target_user.id == current_user.id and payload.role != "admin":
            raise HTTPException(
                status_code=400,
                detail="Cannot remove your own Admin role.",
            )
        target_user.role = payload.role

    db.commit()
    db.refresh(target_user)

    if is_active_val is not None and is_active_val != old_active:
        action = "USER_ACTIVATED" if target_user.is_active else "USER_DEACTIVATED"
        log_audit(
            db=db,
            user_email=current_user.email,
            role=current_user.role,
            action=action,
            details=f"Admin {current_user.email} {'activated' if target_user.is_active else 'deactivated'} user {target_user.email}",
            request=request,
        )

    return target_user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Delete a user account.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    user_email = target_user.email
    db.delete(target_user)
    db.commit()

    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="USER_DELETED",
        details=f"Admin deleted user {user_email}",
        request=request,
    )

    return {"message": f"User {user_email} successfully removed."}
