from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import User
from app.services import analytics_service

router = APIRouter(prefix="/api", tags=["dashboard"])


def _filters(start_date: Optional[date] = None, end_date: Optional[date] = None,
             category: Optional[str] = None, product_id: Optional[str] = None,
             channel: Optional[str] = None, warehouse: Optional[str] = None) -> dict:
    f = {"start": start_date, "end": end_date, "category": category,
         "product_id": product_id, "channel": channel, "warehouse": warehouse}
    return {k: v for k, v in f.items() if v is not None}


@router.get("/dashboard/kpis")
def dashboard_kpis(filters: dict = Depends(_filters), db: Session = Depends(get_db),
                    _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    return analytics_service.get_kpis(db, **filters)


@router.get("/dashboard/trend")
def dashboard_trend(metric: str = "revenue", filters: dict = Depends(_filters),
                     db: Session = Depends(get_db),
                     _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    return analytics_service.get_trends(db, metric=metric, **filters)


@router.get("/dashboard/breakdown")
def dashboard_breakdown(by: str = "category", filters: dict = Depends(_filters),
                         db: Session = Depends(get_db),
                         _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    return analytics_service.get_breakdown(db, by=by, **filters)


@router.get("/dashboard/top-products")
def dashboard_top_products(n: int = 10, ascending: bool = False, filters: dict = Depends(_filters),
                            db: Session = Depends(get_db),
                            _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    return analytics_service.get_top_products(db, n=n, ascending=ascending, **filters)


@router.get("/dashboard/filters/options")
def filter_options(db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    from app.models.models import DailyOperation, Product
    categories = [r[0] for r in db.query(Product.category).distinct() if r[0]]
    channels = [r[0] for r in db.query(DailyOperation.channel).distinct() if r[0]]
    warehouses = [r[0] for r in db.query(DailyOperation.warehouse).distinct() if r[0]]
    return {"categories": categories, "channels": channels, "warehouses": warehouses}
