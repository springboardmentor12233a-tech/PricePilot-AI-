from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import AuditLog, User

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("")
def list_audit_logs(limit: int = 100, db: Session = Depends(get_db),
                     _user: User = Depends(require_roles(*roles.ADMIN))):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
