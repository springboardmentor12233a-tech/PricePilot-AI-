"""
Business Intelligence Reports Download Router.
Protected: Admin and Business Analyst roles only.
"""

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.services.auth import require_role, log_audit
from app.services.report_generator import (
    generate_pdf_report,
    generate_excel_report,
    generate_csv_report,
    generate_price_comparison_pdf,
)

router = APIRouter(prefix="/api/reports", tags=["Business Intelligence Reports"])


@router.get("/summary")
def download_summary_report(
    format: str = Query("pdf", description="Output format: 'pdf', 'csv', or 'excel'"),
    request: Request = None,
    current_user: User = Depends(require_role(["admin", "analyst"])),
    db: Session = Depends(get_db),
):
    """
    Download executive Business Intelligence report.
    Authorized for Admin and Business Analyst roles only.
    Generates PDF with embedded Matplotlib chart, CSV data table, or Excel multi-sheet workbook.
    """
    fmt = format.lower().strip()
    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="REPORT_DOWNLOADED",
        details=f"Downloaded executive BI report in format: {fmt.upper()}",
        request=request,
    )

    if fmt == "excel":
        buf = generate_excel_report()
        headers = {
            "Content-Disposition": "attachment; filename=PricePilot_Executive_Report.xlsx"
        }
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )
    elif fmt == "csv":
        buf = generate_csv_report()
        headers = {
            "Content-Disposition": "attachment; filename=PricePilot_Executive_Report.csv"
        }
        return StreamingResponse(
            buf,
            media_type="text/csv",
            headers=headers,
        )
    else:
        buf = generate_pdf_report(user_email=current_user.email)
        headers = {
            "Content-Disposition": "attachment; filename=PricePilot_Executive_Report.pdf"
        }
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers=headers,
        )


@router.get("/export-csv")
def download_csv(
    request: Request = None,
    current_user: User = Depends(require_role(["admin", "analyst"])),
    db: Session = Depends(get_db),
):
    """
    Dedicated endpoint for CSV report export.
    """
    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="CSV_EXPORT",
        details="Exported full product portfolio to CSV",
        request=request,
    )
    buf = generate_csv_report()
    headers = {
        "Content-Disposition": "attachment; filename=PricePilot_Data_Export.csv"
    }
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers=headers,
    )


@router.get("/export-excel")
def download_excel(
    request: Request = None,
    current_user: User = Depends(require_role(["admin", "analyst"])),
    db: Session = Depends(get_db),
):
    """
    Dedicated endpoint for Excel export.
    """
    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="EXCEL_EXPORT",
        details="Exported full product portfolio to Excel",
        request=request,
    )
    buf = generate_excel_report()
    headers = {
        "Content-Disposition": "attachment; filename=PricePilot_Data_Export.xlsx"
    }
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/price-comparison/{product_id}")
def download_price_comparison_report(
    product_id: str,
    request: Request = None,
    current_user: User = Depends(require_role(["admin", "analyst"])),
    db: Session = Depends(get_db),
):
    """
    Dedicated endpoint for single-product price comparison PDF export.
    Authorized for Admin and Business Analyst roles.
    """
    log_audit(
        db=db,
        user_email=current_user.email,
        role=current_user.role,
        action="REPORT_DOWNLOADED",
        details=f"Exported price comparison PDF for SKU: {product_id}",
        request=request,
    )
    buf = generate_price_comparison_pdf(product_id=product_id, user_email=current_user.email)
    headers = {
        "Content-Disposition": f"attachment; filename=PricePilot_Comparison_{product_id}.pdf"
    }
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers=headers,
    )

