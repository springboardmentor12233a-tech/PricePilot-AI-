from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import User
from app.services import analytics_service

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("/analytics")
def customer_analytics(category: Optional[str] = None, product_id: Optional[str] = None,
                        db: Session = Depends(get_db),
                        _user: User = Depends(require_roles(*roles.FORECASTING_USERS))):
    return analytics_service.get_customer_analytics(db, category=category, product_id=product_id)
