from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.ml.demand_forecasting.forecast_demand import forecast_product_demand
from app.models.models import DemandForecast, User
from app.schemas.schemas import ForecastRequest
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

ALLOWED_HORIZONS = {7, 14, 30, 90, 180, 365}


@router.post("/demand")
def forecast_demand(payload: ForecastRequest, db: Session = Depends(get_db),
                     user: User = Depends(require_roles(*roles.FORECASTING_USERS))):
    horizon = payload.horizon_days if payload.horizon_days in ALLOWED_HORIZONS else 30
    try:
        result = forecast_product_demand(payload.product_id, horizon)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    record = DemandForecast(
        product_id=payload.product_id, horizon_days=horizon, model_used=result["model_used"],
        forecast_json=result["forecast"], trend=result["trend"],
        confidence_score=result["confidence_score"], confidence_label=result["confidence_label"],
        confidence_reason=result["confidence_reason"], mae=result["mae"], rmse=result["rmse"],
    )
    db.add(record)
    db.commit()
    log_action(db, user.id, "forecast", {"product_id": payload.product_id, "horizon_days": horizon})
    return result


@router.get("/{product_id}")
def get_forecast(product_id: str, horizon_days: int = 30, db: Session = Depends(get_db),
                  _user: User = Depends(require_roles(*roles.FORECASTING_USERS))):
    horizon = horizon_days if horizon_days in ALLOWED_HORIZONS else 30
    try:
        return forecast_product_demand(product_id, horizon)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
