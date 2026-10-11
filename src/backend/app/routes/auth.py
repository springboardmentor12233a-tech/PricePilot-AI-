from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import SessionLocal
from app.models.user import User
from app.models.restock_request import RestockRequest
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.auth.auth_utils import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="User"  # Public self-registration is always the base "User" role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": db_user.username, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    return db.query(User).all()


class RoleUpdateRequest(BaseModel):
    role: str


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    request: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    if request.role not in ["Admin", "Business Analyst", "User"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.role = request.role
    db.commit()
    db.refresh(target_user)
    return target_user


@router.put("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = False
    db.commit()
    db.refresh(target_user)
    return target_user


@router.put("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = True
    db.commit()
    db.refresh(target_user)
    return target_user


from datetime import datetime


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "online" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/users", response_model=UserResponse)
def create_user_as_admin(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    if user.role not in ["Admin", "Business Analyst", "User"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(RestockRequest).filter(RestockRequest.requested_by == user_id).delete()
    db.delete(target_user)
    db.commit()
    return {"message": f"User '{target_user.username}' deleted successfully"}