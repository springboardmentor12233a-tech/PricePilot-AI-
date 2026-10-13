from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.ml.price_prediction.predict_price import optimize_price
from app.models.models import Product, User

router = APIRouter(prefix="/api/revenue", tags=["revenue"])


@router.get("/optimize/{product_id}")
def revenue_scenarios(product_id: str, db: Session = Depends(get_db),
                       _user: User = Depends(require_roles(*roles.REVENUE_OPT_USERS))):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        recommended = optimize_price(product_id, "revenue")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    current_price = recommended["current_price"]
    curve = {c["price"]: c for c in recommended["candidate_curve"]}
    # locate nearest candidate to "current" for baseline
    nearest_current = min(curve.keys(), key=lambda p_: abs(p_ - current_price))
    conservative_price = round(current_price * 1.05, 2)
    aggressive_price = round(recommended["recommended_price"], 2)

    def nearest(price):
        key = min(curve.keys(), key=lambda p_: abs(p_ - price))
        return curve[key]

    current_scenario = nearest(current_price)
    conservative_scenario = nearest(conservative_price)
    aggressive_scenario = nearest(aggressive_price)

    def scenario_row(name, price_row):
        return {
            "scenario": name,
            "price": price_row["price"],
            "predicted_demand": price_row["predicted_demand"],
            "expected_revenue": price_row["expected_revenue"],
            "expected_profit": price_row["expected_profit"],
        }

    scenarios = [
        scenario_row("Current", current_scenario),
        scenario_row("Recommended", nearest(recommended["recommended_price"])),
        scenario_row("Conservative", conservative_scenario),
        scenario_row("Aggressive", aggressive_scenario),
    ]

    for s in scenarios:
        s["revenue_difference"] = round(s["expected_revenue"] - current_scenario["expected_revenue"], 2)
        s["profit_difference"] = round(s["expected_profit"] - current_scenario["expected_profit"], 2)
        s["demand_difference"] = round(s["predicted_demand"] - current_scenario["predicted_demand"], 2)

    return {
        "product_id": product_id,
        "note": "All figures are model estimates / simulations, not guarantees.",
        "scenarios": scenarios,
        "elasticity_used": recommended["estimated_elasticity"],
    }
