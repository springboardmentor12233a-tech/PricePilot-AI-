"""
Executive BI report download.
GET /api/v1/reports/download?type=pricing_performance&format=csv|html&limit=50
"""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User
from app.services.report_builder import build_csv, build_html, collect_report_data

router = APIRouter(prefix="/api/v1/reports", tags=["BI Reports"])


@router.get("/download")
def download_report(
    format: Literal["csv", "html"] = "csv",
    type: Literal[
        "full", "pricing_performance", "category_profitability",
        "competitor_benchmark", "demand_summary",
    ] = "full",
    limit: int = Query(50, ge=1, le=500, description="Max products to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = collect_report_data(db, limit=limit)
    if format == "html":
        content, media = build_html(data, type), "text/html; charset=utf-8"
    else:
        content, media = build_csv(data, type), "text/csv; charset=utf-8"

    stamp = datetime.now().strftime("%Y%m%d_%H%M")
    return Response(
        content=content,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="pricepilot_{type}_{stamp}.{format}"'},
    )