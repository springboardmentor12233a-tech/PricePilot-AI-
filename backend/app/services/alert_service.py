"""
Alerts are generated from measurable, auditable conditions -- never from
free-form LLM output -- per the spec's requirement that alerts be based on
real thresholds.
"""
from __future__ import annotations

import pandas as pd
from sqlalchemy.orm import Session

from app.models.models import AIAlert
from app.services import analytics_service


def generate_alerts(db: Session) -> list[AIAlert]:
    new_alerts: list[AIAlert] = []

    competitor_rows = analytics_service.get_competitor_analysis(db)
    for row in competitor_rows:
        gap = row.get("price_gap")
        if gap is None:
            continue
        comp_avg = row.get("competitor_avg") or 1
        gap_pct = gap / comp_avg * 100
        if gap_pct > 15:
            new_alerts.append(AIAlert(
                product_id=row["product_id"], alert_type="competitor_price_high",
                severity="WARNING", title=f"{row['product_id']} priced well above competitors",
                message=f"Price is {gap_pct:.1f}% above the competitor average ({row['competitor_avg']}).",
                metrics=row,
            ))
        elif gap_pct < -15:
            new_alerts.append(AIAlert(
                product_id=row["product_id"], alert_type="competitor_price_low",
                severity="INFO", title=f"{row['product_id']} priced well below competitors",
                message=f"Price is {abs(gap_pct):.1f}% below the competitor average ({row['competitor_avg']}). Possible margin opportunity.",
                metrics=row,
            ))

    stockouts = analytics_service.get_stockout_risks(db, threshold_days=7)
    for row in stockouts:
        severity = "CRITICAL" if row["days_of_cover"] < 3 else "WARNING"
        new_alerts.append(AIAlert(
            product_id=row["product_id"], alert_type="stockout_risk",
            severity=severity, title=f"Stockout risk: {row['product_id']}",
            message=f"Estimated {row['days_of_cover']:.1f} days of stock cover remaining.",
            metrics=row,
        ))

    kpis = analytics_service.get_kpis(db)
    if kpis.get("has_data") and kpis.get("profit_margin_pct_estimated", 100) < 5:
        new_alerts.append(AIAlert(
            product_id=None, alert_type="margin_decline", severity="CRITICAL",
            title="Overall estimated profit margin is critically low",
            message=f"Estimated profit margin is {kpis['profit_margin_pct_estimated']}%.",
            metrics=kpis,
        ))
    if kpis.get("has_data") and kpis.get("stockout_rate_pct", 0) > 10:
        new_alerts.append(AIAlert(
            product_id=None, alert_type="stockout_rate_high", severity="WARNING",
            title="Stockout rate above 10% across the catalog",
            message=f"Stockout rate is {kpis['stockout_rate_pct']}%.",
            metrics=kpis,
        ))

    for a in new_alerts:
        db.add(a)
    db.commit()
    return new_alerts
