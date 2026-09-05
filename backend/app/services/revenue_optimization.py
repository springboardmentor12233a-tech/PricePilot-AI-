"""
Revenue Optimization Module (PDF Module 6) -- business logic.

Core idea: PRICE ELASTICITY OF DEMAND. If we raise a product's price,
demand usually drops -- but by how much varies per product. Once we
estimate that relationship from real history, we can simulate "what if
we changed the price?" without actually changing it -- this is the
"Revenue simulation" and "Margin optimization" the PDF asks for.
"""

import numpy as np
from sqlalchemy.orm import Session

from app.models.models import Product, PriceHistory


def compute_elasticity(db: Session, product_id: int) -> dict | None:
    """
    Estimates price elasticity of demand using a LOG-LOG REGRESSION on
    this product's real (price, quantity) history.

    TEACHING NOTE -- why log-log, not a plain price-vs-quantity line:
    Economists use log-log because it turns the relationship into a
    simple slope that directly represents a PERCENTAGE relationship:
    "a 1% price increase causes an elasticity% change in quantity."
    A plain (non-log) line would instead give you an absolute-units
    slope, which doesn't transfer well across products at very
    different price/volume scales. This is a standard, well-established
    technique, not something invented for this project.

    Elasticity is typically NEGATIVE (price up -> demand down).
      -1 < elasticity < 0  -> "inelastic": demand barely reacts to price
      elasticity < -1       -> "elastic": demand reacts strongly to price
    """
    rows = (
        db.query(PriceHistory.price, PriceHistory.qty)
        .filter(PriceHistory.product_id == product_id, PriceHistory.qty > 0, PriceHistory.price > 0)
        .all()
    )

    if len(rows) < 4:
        return None  # not enough data points for a meaningful regression

    prices = np.array([r.price for r in rows])
    qtys = np.array([r.qty for r in rows])

    log_prices = np.log(prices)
    log_qtys = np.log(qtys)

    # Fit a straight line to the logged data: log(qty) = intercept + elasticity * log(price)
    # np.polyfit returns [slope, intercept] for a degree-1 fit.
    elasticity, intercept = np.polyfit(log_prices, log_qtys, 1)

    # R-squared: how well this line actually fits the real data (0-1).
    # Low R2 means the price-demand relationship is noisy/weak for this
    # product -- important to report honestly, same as our confidence
    # scores elsewhere.
    predicted = elasticity * log_prices + intercept
    ss_res = np.sum((log_qtys - predicted) ** 2)
    ss_tot = np.sum((log_qtys - log_qtys.mean()) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

    if elasticity < -1:
        interpretation = "Elastic: demand is highly sensitive to price changes"
    elif elasticity < 0:
        interpretation = "Inelastic: demand is relatively insensitive to price changes"
    else:
        interpretation = "Unusual: demand appears to rise with price (check data quality for this product)"

    return {
        "elasticity": float(elasticity),
        "interpretation": interpretation,
        "data_points_used": len(rows),
        "r_squared": float(max(0, r_squared)),
    }


def _get_usable_elasticity(db: Session, product_id: int) -> tuple[float, bool] | None:
    """
    Returns (elasticity_to_use, was_capped).

    TEACHING NOTE -- why we cap elasticity before using it for simulation:
    With only ~12-16 monthly data points per product, a single noisy
    observation can push the fitted elasticity to an extreme value
    (we saw -9.9 on one product during testing). Using an extreme
    elasticity to simulate a LARGE price change extrapolates far beyond
    anything actually observed in the data, producing nonsensical
    results (e.g. "+2000% revenue"). Real-world price elasticities for
    retail goods are rarely more extreme than about -5. Capping here is
    a deliberate, explainable business rule to keep simulations
    realistic -- not hiding the real number, which is still reported
    as-is by compute_elasticity()/the /elasticity endpoint.
    """
    result = compute_elasticity(db, product_id)
    if result is None:
        return None

    raw = result["elasticity"]
    capped = float(np.clip(raw, -5.0, -0.05))
    return capped, (capped != raw)


def simulate_revenue(db: Session, product_id: int, price_change_pct: float) -> dict | None:
    """
    Projects revenue if price changed by price_change_pct (e.g. 10 for +10%),
    using the constant-elasticity demand formula:
        new_qty = old_qty * (new_price / old_price) ^ elasticity
    This is the standard formula implied by a log-log elasticity model --
    it's the same relationship compute_elasticity() just estimated, run
    forward for a hypothetical new price instead of a historical one.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    elasticity_data = _get_usable_elasticity(db, product_id)
    if elasticity_data is None:
        return None
    elasticity, was_capped = elasticity_data

    rows = (
        db.query(PriceHistory.price, PriceHistory.qty)
        .filter(PriceHistory.product_id == product_id, PriceHistory.qty > 0)
        .all()
    )
    current_price = float(np.mean([r.price for r in rows]))
    current_avg_qty = float(np.mean([r.qty for r in rows]))
    current_revenue = current_price * current_avg_qty

    simulated_price = current_price * (1 + price_change_pct / 100)
    simulated_qty = current_avg_qty * (simulated_price / current_price) ** elasticity
    simulated_revenue = simulated_price * simulated_qty

    revenue_change_pct = ((simulated_revenue - current_revenue) / current_revenue) * 100 if current_revenue else 0.0

    return {
        "product_id": product.id,
        "product_name": product.name,
        "current_price": round(current_price, 2),
        "current_avg_qty": round(current_avg_qty, 2),
        "current_revenue": round(current_revenue, 2),
        "simulated_price": round(simulated_price, 2),
        "price_change_pct": price_change_pct,
        "simulated_qty": round(simulated_qty, 2),
        "simulated_revenue": round(simulated_revenue, 2),
        "revenue_change_pct": round(revenue_change_pct, 2),
    }


def optimize_price(db: Session, product_id: int) -> dict | None:
    """
    Searches a range of candidate price changes (-30% to +30%) and picks
    whichever maximizes projected revenue, using the same elasticity
    model as simulate_revenue().

    TEACHING NOTE -- why a search instead of solving it directly with
    calculus: for a pure constant-elasticity demand curve, revenue vs
    price doesn't have a normal interior maximum the way profit-vs-price
    does (it's monotonic beyond a certain point). Rather than presenting
    a possibly-nonsensical extreme result (e.g. "raise price to $10,000"),
    we constrain the search to a REALISTIC range a business would
    actually consider, and report the best option within that range.
    This is a deliberate, explainable business rule -- good to be able
    to explain if asked why we search -30%..+30% specifically.
    """
    # Search range kept moderate (-20% to +20%) rather than wider, since
    # our products typically have only ~12-16 historical price points --
    # a narrower range stays closer to prices we've actually observed,
    # reducing how far the model has to extrapolate.
    candidates = np.arange(-20, 21, 2)

    best = None
    for pct in candidates:
        sim = simulate_revenue(db, product_id, float(pct))
        if sim is None:
            return None
        if best is None or sim["simulated_revenue"] > best["simulated_revenue"]:
            best = sim

    if best is None:
        return None

    return {
        "product_id": best["product_id"],
        "product_name": best["product_name"],
        "current_price": best["current_price"],
        "current_revenue": best["current_revenue"],
        "recommended_price": best["simulated_price"],
        "recommended_price_change_pct": best["price_change_pct"],
        "expected_revenue": best["simulated_revenue"],
        "expected_revenue_uplift_pct": best["revenue_change_pct"],
    }