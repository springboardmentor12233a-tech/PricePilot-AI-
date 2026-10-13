from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.ml.price_prediction.predict_price import _latest_row_for_product, get_model_metadata, optimize_price
from app.models.models import PricePrediction, User
from app.schemas.schemas import PriceOptimizeRequest, PricePredictRequest
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/pricing", tags=["pricing"])


@router.post("/predict")
def predict_price(payload: PricePredictRequest, db: Session = Depends(get_db),
                   user: User = Depends(require_roles(*roles.PRICING_EDITORS))):
    row = _latest_row_for_product(payload.product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="No data for this product")
    meta = get_model_metadata()
    result = optimize_price(payload.product_id, objective="revenue")
    log_action(db, user.id, "prediction", {"product_id": payload.product_id})
    return {
        "current_price": result["current_price"],
        "model_based_recommended_price": result["recommended_price"],
        "model_metadata": meta,
    }


@router.post("/optimize")
def optimize(payload: PriceOptimizeRequest, db: Session = Depends(get_db),
              user: User = Depends(require_roles(*roles.PRICING_EDITORS))):
    try:
        result = optimize_price(payload.product_id, payload.objective)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    meta = get_model_metadata() or {}
    record = PricePrediction(
        product_id=payload.product_id, requested_by=user.id, objective=payload.objective,
        current_price=result["current_price"], recommended_price=result["recommended_price"],
        price_change_pct=result["price_change_pct"], expected_demand=result["expected_demand"],
        expected_revenue=result["expected_revenue"], expected_profit=result["expected_profit"],
        model_used=meta.get("model_name", "elasticity_heuristic"),
        model_mae=meta.get("test_metrics", {}).get("test_mae"),
        model_rmse=meta.get("test_metrics", {}).get("test_rmse"),
        model_r2=meta.get("test_metrics", {}).get("test_r2"),
        explanation=result["explanation_factors"],
    )
    db.add(record)
    db.commit()
    log_action(db, user.id, "price_optimization", {"product_id": payload.product_id, "objective": payload.objective})
    return result


@router.get("/history/{product_id}")
def prediction_history(product_id: str, db: Session = Depends(get_db),
                        _user: User = Depends(require_roles(*roles.PRICING_EDITORS))):
    rows = (
        db.query(PricePrediction)
        .filter(PricePrediction.product_id == product_id)
        .order_by(PricePrediction.created_at.desc())
        .limit(20)
        .all()
    )
    return rows
