"""
Pricing Analytics Dashboard API endpoints (PDF Module 7).

Now requires a logged-in user (Depends(get_current_user)) -- this is
what makes "authentication" actually mean something end-to-end, rather
than existing as an unused API sitting next to a wide-open dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dashboard import DashboardOverview
from app.services.dashboard import get_dashboard_overview
from app.api.routes.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/dashboard", tags=["Pricing Analytics Dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def dashboard_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dashboard_overview(db)