"""
Authentication, Authorization (RBAC), and Audit Logging Services.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, Base, engine, SessionLocal
from app.models import User, AuditLog

security = HTTPBearer(auto_error=False)


# --- Password Hashing ---

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# --- JWT Token Creation & Verification ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --- Dependencies: Current User & RBAC ---

def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.credentials
    payload = decode_access_token(token)
    email: Optional[str] = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in system.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Example: Depends(require_role(["admin", "analyst"]))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. This action requires one of the following roles: {', '.join(allowed_roles)}. Your current role is '{current_user.role}'."
            )
        return current_user
    return role_checker


# --- Audit Logging ---

def log_audit(
    db: Session,
    user_email: str,
    role: str,
    action: str,
    details: Optional[str] = None,
    request: Optional[Request] = None
):
    try:
        ip = request.client.host if request and request.client else "127.0.0.1"
        audit = AuditLog(
            user_email=user_email,
            role=role,
            action=action,
            details=details,
            ip_address=ip,
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        # Logging failure should not crash the primary transaction
        print(f"[Audit Log Error] {e}")


# --- DB Initialization & Demo Users Seeding ---

def init_db_and_seed_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_users = [
            {
                "email": "admin@pricepilot.ai",
                "password": "Admin@123",
                "full_name": "Dr. Sarah Chen (Admin)",
                "role": "admin"
            },
            {
                "email": "analyst@pricepilot.ai",
                "password": "Analyst@123",
                "full_name": "Marcus Vance (Lead Analyst)",
                "role": "analyst"
            },
            {
                "email": "viewer@pricepilot.ai",
                "password": "Viewer@123",
                "full_name": "Elena Rostova (Stakeholder)",
                "role": "viewer"
            }
        ]

        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_user = User(
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    created_at=datetime.utcnow()
                )
                db.add(new_user)
        db.commit()

        # Seed initial audit log if empty
        if db.query(AuditLog).count() == 0:
            initial_logs = [
                AuditLog(
                    user_email="system@pricepilot.ai",
                    role="system",
                    action="SYSTEM_INIT",
                    details="PricePilot AI initialized with econometric regression parameters (Dataset 1 beta=-71.673)",
                    ip_address="127.0.0.1",
                    timestamp=datetime.utcnow() - timedelta(days=2)
                ),
                AuditLog(
                    user_email="admin@pricepilot.ai",
                    role="admin",
                    action="MODEL_TRAINED",
                    details="Completed 3-month rolling linear regression demand forecasts across 8 SKUs",
                    ip_address="127.0.0.1",
                    timestamp=datetime.utcnow() - timedelta(days=1)
                )
            ]
            db.add_all(initial_logs)
            db.commit()

    finally:
        db.close()
