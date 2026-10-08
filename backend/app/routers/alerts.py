"""
Proactive Pricing & Demand Alerts Router.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import AlertItem, DismissedAlert, User
from app.services.data_loader import get_all_products
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/alerts", tags=["AI Alerts & Notifications"])


def _generate_active_alerts(db: Session, user_email: Optional[str] = None) -> List[AlertItem]:
    products = get_all_products()
    dismissed_ids = set()
    if user_email:
        dismissed_records = db.query(DismissedAlert.alert_id).filter(
            DismissedAlert.user_email == user_email
        ).all()
        dismissed_ids = {r[0] for r in dismissed_records}

    alerts: List[AlertItem] = []

    for p in products:
        gap = p.get("price_gap_pct", 0.0)
        conf = p.get("confidence_score", 1.0)
        trend = p.get("demand_trend", "Stable")
        stock = p.get("stock_status", "In Stock")
        stock_units = p.get("stock_level", 100)

        # 1. Critical Price Gap Alert (|gap| >= 18%)
        if abs(gap) >= 18.0:
            alert_id = f"alert_gap_{p['id']}"
            if alert_id not in dismissed_ids:
                alerts.append(AlertItem(
                    alert_id=alert_id,
                    product_id=p["id"],
                    product_name=p["name"],
                    category=p["category"],
                    severity="high" if abs(gap) >= 20.0 else "medium",
                    type="PRICE_GAP",
                    title=f"Significant Price Discrepancy ({gap:+.1f}%)",
                    message=f"Current price ${p['current_price']:,.2f} is substantially misaligned with optimal model price ${p['recommended_price']:,.2f}. Competitor benchmark is ${p['competitor_price']:,.2f}.",
                    suggested_action=f"Reprice to ${p['recommended_price']:,.2f} to recapture lost market share.",
                    timestamp=datetime.utcnow(),
                    metrics={"current_price": p["current_price"], "recommended_price": p["recommended_price"], "price_gap_pct": gap}
                ))

        # 2. Low Model Confidence Alert (R2 < 0.35)
        if conf < 0.35:
            alert_id = f"alert_conf_{p['id']}"
            if alert_id not in dismissed_ids:
                alerts.append(AlertItem(
                    alert_id=alert_id,
                    product_id=p["id"],
                    product_name=p["name"],
                    category=p["category"],
                    severity="critical",
                    type="LOW_CONFIDENCE",
                    title=f"Low Confidence Model Alert (R² = {conf:.3f})",
                    message=f"Model confidence dropped to {conf*100:.1f}%. High variance in transaction velocity suggests non-linear elasticity factors or sparse transaction frequency.",
                    suggested_action="Perform manual qualitative pricing review before approving automated adjustments.",
                    timestamp=datetime.utcnow(),
                    metrics={"confidence_score": conf, "r_squared": conf}
                ))

        # 3. Softening Demand Alert (Trend == Decreasing)
        if trend == "Decreasing":
            alert_id = f"alert_trend_{p['id']}"
            if alert_id not in dismissed_ids:
                alerts.append(AlertItem(
                    alert_id=alert_id,
                    product_id=p["id"],
                    product_name=p["name"],
                    category=p["category"],
                    severity="medium",
                    type="DEMAND_DROP",
                    title="Softening Demand Trend Detected",
                    message=f"3-month rolling regression indicates negative sales trajectory for {p['name']}. Weekly unit velocity is contracting.",
                    suggested_action="Review competitor promotional schedule and bundle incentives.",
                    timestamp=datetime.utcnow(),
                    metrics={"demand_trend": trend, "units_sold": p["units_sold"]}
                ))

        # 4. Critical Stock Alert
        if stock == "Critical" or stock_units < 20:
            alert_id = f"alert_stock_{p['id']}"
            if alert_id not in dismissed_ids:
                alerts.append(AlertItem(
                    alert_id=alert_id,
                    product_id=p["id"],
                    product_name=p["name"],
                    category=p["category"],
                    severity="high",
                    type="CRITICAL_STOCK",
                    title=f"Critical Inventory Level ({stock_units} Units)",
                    message=f"Stock for {p['name']} is critically depleted ({stock_units} remaining units). Price cuts should be suspended to avoid stockout.",
                    suggested_action="Raise price or hold to ration existing inventory until replenishment arrives.",
                    timestamp=datetime.utcnow(),
                    metrics={"stock_level": stock_units, "stock_status": stock}
                ))

    # Sort critical & high first
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: severity_order.get(x.severity, 4))
    return alerts


@router.get("", response_model=List[AlertItem])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns list of active proactive system alerts.
    """
    return _generate_active_alerts(db, user_email=current_user.email)


@router.get("/{alert_id}", response_model=AlertItem)
def get_alert_by_id(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns a single active alert by alert_id, or 404 if not found.
    """
    alerts = _generate_active_alerts(db, user_email=current_user.email)
    for a in alerts:
        if a.alert_id == alert_id:
            return a
    raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")


@router.post("/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Dismisses an alert item so it is removed from the active alerts list.
    """
    existing = db.query(DismissedAlert).filter(
        DismissedAlert.alert_id == alert_id,
        DismissedAlert.user_email == current_user.email,
    ).first()
    if not existing:
        dismissal = DismissedAlert(
            alert_id=alert_id,
            user_email=current_user.email,
            dismissed_at=datetime.utcnow()
        )
        db.add(dismissal)
        db.commit()
    return {"status": "dismissed", "alert_id": alert_id}
