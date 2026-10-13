from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.ml.demand_forecasting.evaluate_demand_model import evaluate as evaluate_demand
from app.ml.demand_forecasting.train_demand_model import run as train_demand
from app.ml.price_prediction.evaluate_price_model import evaluate as evaluate_price
from app.ml.price_prediction.train_price_model import train_and_evaluate as train_price
from app.models.models import User
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/performance")
def performance(_user: User = Depends(require_roles(*roles.DASHBOARD_VIEWERS))):
    return {"price_model": evaluate_price(), "demand_model": evaluate_demand()}


@router.post("/train/price")
def train_price_model(db: Session = Depends(get_db), user: User = Depends(require_roles(*roles.MODEL_MGMT_USERS))):
    result = train_price()
    log_action(db, user.id, "model_training", {"model": "price"})
    return result


@router.post("/train/demand")
def train_demand_model(db: Session = Depends(get_db), user: User = Depends(require_roles(*roles.MODEL_MGMT_USERS))):
    result = train_demand()
    log_action(db, user.id, "model_training", {"model": "demand"})
    return result
