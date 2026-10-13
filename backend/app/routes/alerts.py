from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import AIAlert, User
from app.services.alert_service import generate_alerts
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("/generate")
def trigger_alert_generation(db: Session = Depends(get_db), user: User = Depends(require_roles(*roles.AI_USERS))):
    alerts = generate_alerts(db)
    log_action(db, user.id, "alerts_generated", {"count": len(alerts)})
    return {"generated": len(alerts)}


@router.get("")
def list_alerts(severity: Optional[str] = None, is_read: Optional[bool] = None,
                 is_archived: bool = False, search: Optional[str] = None,
                 db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles.AI_USERS))):
    q = db.query(AIAlert).filter(AIAlert.is_archived == is_archived)
    if severity:
        q = q.filter(AIAlert.severity == severity)
    if is_read is not None:
        q = q.filter(AIAlert.is_read == is_read)
    if search:
        q = q.filter(AIAlert.title.ilike(f"%{search}%"))
    return q.order_by(AIAlert.created_at.desc()).limit(100).all()


@router.patch("/{alert_id}/read")
def mark_read(alert_id: str, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles.AI_USERS))):
    a = db.get(AIAlert, alert_id)
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.is_read = True
    db.commit()
    return a


@router.patch("/{alert_id}/archive")
def archive_alert(alert_id: str, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles.AI_USERS))):
    a = db.get(AIAlert, alert_id)
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.is_archived = True
    db.commit()
    return a
