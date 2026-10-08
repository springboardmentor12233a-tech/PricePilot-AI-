from sqlalchemy.orm import Session
# from models import AuditLog
# from backend.models import AuditLog
from backend.models import AuditLog

def create_audit_log(
    db: Session,
    username: str,
    role: str,
    action: str,
    target: str = None,
    old_value: str = None,
    new_value: str = None
):
    audit_log = AuditLog(
        username=username,
        role=role,
        action=action,
        target=target,
        old_value=old_value,
        new_value=new_value
    )

    db.add(audit_log)
    db.commit()

    return audit_log