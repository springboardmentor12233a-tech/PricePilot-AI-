from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import Report, User
from app.schemas.schemas import ReportGenerateRequest
from app.services.audit_service import log_action
from app.services.report_service import generate_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate")
def create_report(payload: ReportGenerateRequest, db: Session = Depends(get_db),
                   user: User = Depends(require_roles(*roles.REPORT_USERS))):
    filters = {
        "start": payload.start_date, "end": payload.end_date, "category": payload.category,
        "product_id": payload.product_id, "channel": payload.channel,
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    path = generate_report(db, payload.report_type, payload.file_format, filters)

    record = Report(
        report_type=payload.report_type, generated_by=user.id, filters=filters,
        file_format=payload.file_format, file_path=path,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    log_action(db, user.id, "report_generated", {"report_type": payload.report_type, "format": payload.file_format})
    return {"report_id": record.id, "file_path": path}


@router.get("")
def list_reports(db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles.REPORT_USERS))):
    return db.query(Report).order_by(Report.created_at.desc()).limit(50).all()


@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db),
                     _user: User = Depends(require_roles(*roles.REPORT_USERS))):
    record = db.get(Report, report_id)
    if not record:
        return {"error": "Report not found"}
    media_types = {"pdf": "application/pdf", "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "csv": "text/csv"}
    return FileResponse(record.file_path, media_type=media_types.get(record.file_format, "application/octet-stream"),
                         filename=record.file_path.split("/")[-1])
