"""
Competitor Analysis Module (PDF Module 5) -- business logic.

No ML model here on purpose: this module is about COMPARING existing
data (our prices vs competitor prices already sitting in the database),
not predicting anything new. Not every module in a project needs to be
a trained model -- sometimes the value is in querying and interpreting
data correctly, which is just as real a skill.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import Product, PriceHistory, CompetitorPrice

# Thresholds for classifying how our price compares to competitors.
# e.g. if our price is more than 10% above the competitor average,
# we're "Premium" positioned. Chosen as a reasonable, explainable
# starting point -- not derived from a dataset, so mention this as a
# configurable business rule if asked, not a scientifically tuned number.
PREMIUM_THRESHOLD = 0.10    # +10% or more above competitor avg
DISCOUNT_THRESHOLD = -0.10  # -10% or more below competitor avg

# Same idea, used for flagging "opportunities" worth acting on
OPPORTUNITY_THRESHOLD = 0.15  # 15% gap triggers a flagged opportunity


def _latest_price(db: Session, product_id: int) -> float | None:
    """Most recent PriceHistory row for a product."""
    row = (
        db.query(PriceHistory)
        .filter(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.recorded_at.desc())
        .first()
    )
    return row.price if row else None


def _latest_competitor_prices(db: Session, product_id: int) -> list[CompetitorPrice]:
    """
    Gets each competitor's MOST RECENT price for this product.

    TEACHING NOTE -- why this needs a subquery, not a simple filter:
    Our competitor_prices table has MANY rows per competitor over time
    (comp_1's price in January, February, March...). We only want each
    competitor's latest one, not their whole history, for a "current"
    comparison. This is a common SQL pattern: find the max date PER
    GROUP (per competitor_name here), then join back to get that row.
    """
    subquery = (
        db.query(
            CompetitorPrice.competitor_name,
            func.max(CompetitorPrice.recorded_at).label("latest_date"),
        )
        .filter(CompetitorPrice.product_id == product_id)
        .group_by(CompetitorPrice.competitor_name)
        .subquery()
    )

    rows = (
        db.query(CompetitorPrice)
        .join(
            subquery,
            (CompetitorPrice.competitor_name == subquery.c.competitor_name)
            & (CompetitorPrice.recorded_at == subquery.c.latest_date),
        )
        .filter(CompetitorPrice.product_id == product_id)
        .all()
    )
    return rows


def classify_positioning(gap_pct: float) -> str:
    if gap_pct >= PREMIUM_THRESHOLD:
        return "Premium"
    elif gap_pct <= DISCOUNT_THRESHOLD:
        return "Discount"
    return "Competitive"


def get_competitor_comparison(db: Session, product_id: int) -> dict | None:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    our_price = _latest_price(db, product_id)
    comp_rows = _latest_competitor_prices(db, product_id)

    if our_price is None or not comp_rows:
        return None

    comp_prices = [c.price for c in comp_rows]
    comp_avg = sum(comp_prices) / len(comp_prices)
    comp_min = min(comp_prices)
    comp_max = max(comp_prices)

    # Gap: how far our price sits from the competitor average, as a
    # percentage. Positive = we're pricier than competitors on average.
    gap_pct = (our_price - comp_avg) / comp_avg if comp_avg else 0.0

    return {
        "product_id": product.id,
        "product_name": product.name,
        "our_price": our_price,
        "competitor_prices": [
            {"competitor_name": c.competitor_name, "price": c.price, "recorded_at": c.recorded_at}
            for c in comp_rows
        ],
        "competitor_avg": comp_avg,
        "competitor_min": comp_min,
        "competitor_max": comp_max,
        "price_gap_pct": round(gap_pct * 100, 2),
        "positioning": classify_positioning(gap_pct),
    }


def detect_pricing_opportunities(db: Session) -> list[dict]:
    """
    Scans every retail_price_optimization product and flags any where our
    price diverges from the competitor average by more than
    OPPORTUNITY_THRESHOLD -- these are candidates for a pricing decision:
      - Overpriced (we're notably ABOVE competitors) -> risk of losing sales
      - Underpriced (we're notably BELOW competitors) -> leaving revenue on the table
    """
    products = db.query(Product).filter(Product.source_dataset == "retail_price_optimization").all()

    opportunities = []
    for product in products:
        comparison = get_competitor_comparison(db, product.id)
        if comparison is None:
            continue

        gap_fraction = comparison["price_gap_pct"] / 100
        if abs(gap_fraction) < OPPORTUNITY_THRESHOLD:
            continue  # gap too small to flag as an actionable opportunity

        if gap_fraction > 0:
            opp_type = "Overpriced"
            recommendation = (
                f"Our price is {comparison['price_gap_pct']}% above the competitor "
                f"average -- consider lowering price to stay competitive."
            )
        else:
            opp_type = "Underpriced"
            recommendation = (
                f"Our price is {abs(comparison['price_gap_pct'])}% below the competitor "
                f"average -- there may be room to raise price without losing sales."
            )

        opportunities.append({
            "product_id": product.id,
            "product_name": product.name,
            "our_price": comparison["our_price"],
            "competitor_avg": comparison["competitor_avg"],
            "gap_pct": comparison["price_gap_pct"],
            "opportunity_type": opp_type,
            "recommendation": recommendation,
        })

    # Largest gaps first -- the most actionable opportunities surface at the top
    opportunities.sort(key=lambda o: abs(o["gap_pct"]), reverse=True)
    return opportunities