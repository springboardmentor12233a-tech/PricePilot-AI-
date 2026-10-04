"""
Authentication & User Management Router.
Includes role-based access control (Admin, Business Analyst) and password reset flow.
"""

import secrets
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    User,
    AuditLog,
    PasswordResetToken,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserCreateRequest,
    RoleUpdateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    require_role,
    log_audit,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user by email and password, returning JWT access token and user info.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )

    log_audit(
        db=db,
        user_email=user.email,
        role=user.role,
        action="USER_LOGIN",
        details=f"Successful login for {user.email} (Role: {user.role})",
        request=request,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get profile of currently authenticated user.
    """
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: UserCreateRequest,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Register a new enterprise user.
    """
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists.",
        )

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="USER_REGISTERED",
        details=f"Admin created account for {new_user.email} with role {new_user.role}",
        request=request,
    )

    return new_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: List all users in system.
    """
    return db.query(User).order_by(User.id.asc()).all()


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only endpoint: Change a user's access role.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == current_user.id and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot demote yourself from Admin role to prevent lockout.",
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
        details=f"Changed {target_user.email} role from '{old_role}' to '{payload.role}'",
        request=request,
    )

    return target_user


@router.delete("/users/{user_id}")
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


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """
    Generates a password reset token and outputs the reset link to the server console.
    """
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        # Don't leak existence in public API, but return generic success message
        return {
            "message": "If this email is registered, a password reset link has been generated.",
            "status": "sent",
        }

    token_str = secrets.token_urlsafe(32)
    reset_record = PasswordResetToken(
        email=email_clean,
        token=token_str,
        expires_at=datetime.utcnow() + timedelta(hours=2),
        used=0,
    )
    db.add(reset_record)
    db.commit()

    reset_url = f"http://localhost:3000/login?reset_token={token_str}"
    print("\n" + "=" * 60)
    print(f"[PRICEPILOT PASSWORD RESET SIMULATION]")
    print(f"Target Account: {email_clean}")
    print(f"Reset Token:    {token_str}")
    print(f"Reset Link:     {reset_url}")
    print("=" * 60 + "\n")

    log_audit(
        db=db,
        user_email=email_clean,
        role=user.role,
        action="PASSWORD_RESET_REQUESTED",
        details="Generated password reset token (logged to server console)",
        request=request,
    )

    return {
        "message": "Password reset instructions generated. Please check server console for reset link.",
        "reset_token": token_str,
        "reset_url": reset_url,
        "status": "sent",
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """
    Resets user password using a valid reset token.
    """
    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == payload.token, PasswordResetToken.used == 0)
        .first()
    )

    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    user = db.query(User).filter(User.email == record.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User associated with token not found.")

    user.hashed_password = hash_password(payload.new_password)
    record.used = 1
    db.commit()

    log_audit(
        db=db,
        user_email=user.email,
        role=user.role,
        action="PASSWORD_RESET_COMPLETED",
        details="User successfully reset account password",
        request=request,
    )

    return {"message": "Password successfully updated. You may now log in with your new password."}
