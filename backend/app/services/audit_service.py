from sqlalchemy.orm import Session

from app.models.models import AuditLog


def log_action(db: Session, user_id: str | None, action: str, metadata: dict | None = None) -> None:
    entry = AuditLog(user_id=user_id, action=action, metadata_json=metadata or {})
    db.add(entry)
    db.commit()
