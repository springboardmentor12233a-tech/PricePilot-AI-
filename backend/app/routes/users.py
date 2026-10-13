from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import RoleEnum, User
from app.schemas.schemas import UserOut
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_roles("ADMIN"))):
    return db.query(User).all()


@router.patch("/{user_id}/role", response_model=UserOut)
def change_role(user_id: str, role: str, db: Session = Depends(get_db),
                 admin: User = Depends(require_roles("ADMIN"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.role = RoleEnum(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    db.commit()
    db.refresh(user)
    log_action(db, admin.id, "role_changed", {"target_user": user_id, "new_role": role})
    return user


@router.patch("/{user_id}/status", response_model=UserOut)
def toggle_status(user_id: str, is_active: bool, db: Session = Depends(get_db),
                   admin: User = Depends(require_roles("ADMIN"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    log_action(db, admin.id, "user_status_changed", {"target_user": user_id, "is_active": is_active})
    return user
