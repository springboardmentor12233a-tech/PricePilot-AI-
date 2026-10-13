from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.ai_service import generate_recommendations
from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import PricingRecommendation, User
from app.services import analytics_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/recommendations")
def create_recommendations(product_id: Optional[str] = None, db: Session = Depends(get_db),
                            user: User = Depends(require_roles(*roles.AI_USERS))):
    context = {
        "kpis": analytics_service.get_kpis(db, product_id=product_id),
        "competitor_analysis": analytics_service.get_competitor_analysis(db, product_id=product_id),
        "stockout_risks": analytics_service.get_stockout_risks(db),
        "top_products": analytics_service.get_top_products(db, n=5),
    }
    recs, source = generate_recommendations(context)

    saved = []
    for r in recs:
        entry = PricingRecommendation(
            product_id=product_id, title=r.get("title", "Recommendation"),
            category=r.get("category", "General"), priority=r.get("priority", "MEDIUM"),
            reason=r.get("reason", ""), supporting_metrics=context,
            recommendation=r.get("recommendation", ""), expected_impact=r.get("expected_impact", ""),
            confidence=float(r.get("confidence", 0.5)), source=source,
        )
        db.add(entry)
        saved.append(entry)
    db.commit()
    log_action(db, user.id, "ai_recommendation_generated", {"product_id": product_id, "source": source})
    return {"source": source, "recommendations": recs}


@router.get("/recommendations")
def list_recommendations(product_id: Optional[str] = None, db: Session = Depends(get_db),
                          _user: User = Depends(require_roles(*roles.AI_USERS))):
    q = db.query(PricingRecommendation)
    if product_id:
        q = q.filter(PricingRecommendation.product_id == product_id)
    return q.order_by(PricingRecommendation.created_at.desc()).limit(50).all()
