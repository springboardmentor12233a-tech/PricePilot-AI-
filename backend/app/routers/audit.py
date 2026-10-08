"""
Enterprise Audit Log Router.
Protected: Admin role only.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import AuditLog, User
from app.services.auth import require_role

router = APIRouter(prefix="/api/audit-logs", tags=["Audit & Governance"])


@router.get("", response_model=List[Dict[str, Any]])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Returns chronologically ordered audit logs tracking enterprise activities:
    logins, report downloads, user management, and model refreshes.
    Admin-only access.
    """
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_email": log.user_email,
            "role": log.role,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]


@router.get("/{log_id}", response_model=Dict[str, Any])
def get_audit_log_by_id(
    log_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Get a single audit log entry by ID. Returns 404 if not found.
    Admin-only access.
    """
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail=f"Audit log entry {log_id} not found.")
    return {
        "id": log.id,
        "user_email": log.user_email,
        "role": log.role,
        "action": log.action,
        "details": log.details,
        "ip_address": log.ip_address,
        "timestamp": log.timestamp.isoformat(),
    }
