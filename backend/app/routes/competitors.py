from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import User
from app.services import analytics_service

router = APIRouter(prefix="/api/competitors", tags=["competitors"])


@router.get("")
def all_competitor_analysis(db: Session = Depends(get_db),
                             _user: User = Depends(require_roles(*roles.FORECASTING_USERS))):
    return analytics_service.get_competitor_analysis(db)


@router.get("/{product_id}")
def competitor_analysis_for_product(product_id: str, db: Session = Depends(get_db),
                                     _user: User = Depends(require_roles(*roles.FORECASTING_USERS))):
    return analytics_service.get_competitor_analysis(db, product_id=product_id)
