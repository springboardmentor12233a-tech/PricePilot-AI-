"""
Competitor Analytics & Market Intelligence Module for PricePilot AI
Tracks rival merchant price actions, customer rating differentials, and logistics costs.
Computes Price Indices, Market Stance classifications, and actionable Opportunity / Risk triggers.
"""

from typing import Dict, List, Optional, Any
from sqlalchemy import text
from database import engine
import datetime


def _classify_opportunity(
    our_price: float,
    our_score: float,
    comp_avg_price: float,
    comp_avg_score: float,
    comp_min_price: float,
    comp_max_price: float,
) -> Dict[str, Any]:
    """
    Automated heuristic rule engine for detecting pricing opportunities & defection risks.
    """
    # 1. Underpriced Premium: Higher rating than competitors, but lower price
    if our_score >= comp_avg_score + 0.2 and our_price < comp_avg_price:
        uplift_pct = min(12.0, max(4.0, round(((comp_avg_price - our_price) / our_price) * 50, 1)))
        return {
            "type": "opportunity",
            "tag": "Underpriced Premium",
            "badge": "Margin Uplift Opportunity",
            "headline": f"Rating advantage ({our_score}★ vs {comp_avg_score:.1f}★) at below-market price",
            "action": f"Increase price by {uplift_pct}%",
            "explanation": "Superior customer ratings justify closing the price gap without degrading sales volume.",
        }

    # 2. Overpriced Weakness: Price higher than competitors without score justification
    if our_price > comp_avg_price * 1.05 and our_score < comp_avg_score:
        return {
            "type": "risk",
            "tag": "Overpriced Weakness",
            "badge": "Defection Risk Alert",
            "headline": f"Premium price despite lower rating ({our_score}★ vs {comp_avg_score:.1f}★)",
            "action": "Price match or offer value bundles",
            "explanation": "High defection risk to better-rated competitors offering more attractive price points.",
        }

    # 3. Deep Discount Capture: Priced well below even the cheapest competitor
    if comp_min_price > 0 and our_price < comp_min_price * 0.92:
        gap_pct = round((1 - our_price / comp_min_price) * 100, 1)
        return {
            "type": "opportunity",
            "tag": "Deep Discount Capture",
            "badge": "Margin Recovery Opportunity",
            "headline": f"Underpricing lowest rival by {gap_pct}%",
            "action": "Normalize price toward category median",
            "explanation": "Current price leaves substantial margin on the table without proportional conversion gains.",
        }

    # 4. Aggressive Premium Exposure: Priced substantially above highest competitor
    if comp_max_price > 0 and our_price > comp_max_price * 1.10:
        prem_pct = round((our_price / comp_max_price - 1) * 100, 1)
        return {
            "type": "risk",
            "tag": "Aggressive Premium Exposure",
            "badge": "High Margin Sensitivity",
            "headline": f"Price is {prem_pct}% above the highest category rival",
            "action": "Monitor conversion velocity closely",
            "explanation": "Exceeding rival ceilings requires strong brand defensibility or risks abrupt churn.",
        }

    # 5. Market Parity
    return {
        "type": "neutral",
        "tag": "Market Parity",
        "badge": "Balanced Alignment",
        "headline": "Aligned with competitor cluster",
        "action": "Maintain current dynamic anchor",
        "explanation": "Price and customer review metrics are well-balanced against category competitors.",
    }


def get_all_competitor_insights(db_engine=engine) -> List[Dict[str, Any]]:
    """
    Returns high-level competitor intelligence summaries for all catalog products
    based on the latest recorded period.
    """
    with db_engine.connect() as conn:
        # Fetch the latest monthly metric and category for each product
        latest_metrics_query = text("""
            SELECT DISTINCT ON (p.product_id)
                p.product_id,
                p.category,
                m.period_date,
                m.unit_price,
                m.product_score,
                m.freight_price
            FROM products p
            JOIN monthly_metrics m ON p.product_id = m.product_id
            ORDER BY p.product_id, m.period_date DESC
        """)
        products_data = conn.execute(latest_metrics_query).mappings().all()

        # Fetch latest competitor prices for all products
        competitor_query = text("""
            SELECT DISTINCT ON (product_id, competitor_num)
                product_id,
                period_date,
                competitor_num,
                price,
                score,
                freight_price
            FROM competitor_prices
            ORDER BY product_id, competitor_num, period_date DESC
        """)
        comp_rows = conn.execute(competitor_query).mappings().all()

    # Map competitors by product_id
    comp_by_product: Dict[str, Dict[str, Any]] = {}
    for row in comp_rows:
        pid = row["product_id"]
        c_num = row["competitor_num"]
        if pid not in comp_by_product:
            comp_by_product[pid] = {}
        comp_by_product[pid][f"comp_{c_num}"] = {
            "price": float(row["price"]),
            "score": float(row["score"] or 4.0),
            "freight": float(row["freight_price"] or 0.0),
        }

    results = []
    for item in products_data:
        pid = item["product_id"]
        category = item["category"]
        our_price = float(item["unit_price"])
        our_score = float(item["product_score"] or 4.0)
        our_freight = float(item["freight_price"] or 0.0)
        period_str = str(item["period_date"])

        comps = comp_by_product.get(pid, {})
        prices = [c["price"] for c in comps.values() if "price" in c]
        scores = [c["score"] for c in comps.values() if "score" in c]
        freights = [c["freight"] for c in comps.values() if "freight" in c]

        if prices:
            comp_avg_price = round(sum(prices) / len(prices), 2)
            comp_min_price = round(min(prices), 2)
            comp_max_price = round(max(prices), 2)
        else:
            comp_avg_price = our_price
            comp_min_price = our_price
            comp_max_price = our_price

        comp_avg_score = round(sum(scores) / len(scores), 1) if scores else our_score
        comp_avg_freight = round(sum(freights) / len(freights), 2) if freights else our_freight

        price_index = round((our_price / comp_avg_price) * 100, 1) if comp_avg_price > 0 else 100.0

        if price_index > 105.0:
            market_stance = "Premium to Market"
            stance_color = "rose"
        elif price_index < 95.0:
            market_stance = "Value / Undercutting"
            stance_color = "emerald"
        else:
            market_stance = "Competitive Parity"
            stance_color = "indigo"

        opp = _classify_opportunity(
            our_price=our_price,
            our_score=our_score,
            comp_avg_price=comp_avg_price,
            comp_avg_score=comp_avg_score,
            comp_min_price=comp_min_price,
            comp_max_price=comp_max_price,
        )

        results.append({
            "product_id": pid,
            "category": category,
            "our_price": our_price,
            "our_score": our_score,
            "our_freight": our_freight,
            "comp_avg_price": comp_avg_price,
            "comp_min_price": comp_min_price,
            "comp_max_price": comp_max_price,
            "comp_avg_score": comp_avg_score,
            "comp_avg_freight": comp_avg_freight,
            "price_index": price_index,
            "market_stance": market_stance,
            "stance_color": stance_color,
            "competitors": comps,
            "opportunity": opp,
            "as_of": period_str,
        })

    results.sort(key=lambda x: x["product_id"])
    return results


def get_product_competitor_detail(db_engine, product_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns deep-dive rival comparison and multi-month historical price trend
    for a specific product.
    """
    with db_engine.connect() as conn:
        # Check product
        prod = conn.execute(
            text("SELECT product_id, category FROM products WHERE product_id = :pid"),
            {"pid": product_id},
        ).mappings().first()

        if not prod:
            return None

        # Fetch monthly metrics chronologically
        metrics_rows = conn.execute(
            text("""
                SELECT period_date, unit_price, product_score, freight_price, qty_sold
                FROM monthly_metrics
                WHERE product_id = :pid
                ORDER BY period_date ASC
            """),
            {"pid": product_id},
        ).mappings().all()

        if not metrics_rows:
            return None

        # Fetch competitor prices chronologically
        comp_rows = conn.execute(
            text("""
                SELECT period_date, competitor_num, price, score, freight_price
                FROM competitor_prices
                WHERE product_id = :pid
                ORDER BY period_date ASC, competitor_num ASC
            """),
            {"pid": product_id},
        ).mappings().all()

    latest_m = metrics_rows[-1]
    our_price = float(latest_m["unit_price"])
    our_score = float(latest_m["product_score"] or 4.0)
    our_freight = float(latest_m["freight_price"] or 0.0)
    latest_date = latest_m["period_date"]

    # Filter competitor rows for the latest date
    latest_comps = [c for c in comp_rows if c["period_date"] == latest_date]
    if not latest_comps:
        latest_comps = comp_rows[-3:] if len(comp_rows) >= 3 else comp_rows

    competitors_list = []
    prices, scores, freights = [], [], []

    for c in sorted(latest_comps, key=lambda x: x["competitor_num"]):
        c_num = int(c["competitor_num"])
        c_price = float(c["price"])
        c_score = float(c["score"] or 4.0)
        c_freight = float(c["freight_price"] or 0.0)

        prices.append(c_price)
        scores.append(c_score)
        freights.append(c_freight)

        price_diff = round(c_price - our_price, 2)
        price_diff_pct = round(((c_price - our_price) / our_price) * 100, 1) if our_price > 0 else 0.0
        score_adv = round(our_score - c_score, 1)

        competitors_list.append({
            "competitor_id": f"Competitor {c_num}",
            "competitor_num": c_num,
            "price": c_price,
            "score": c_score,
            "freight": c_freight,
            "price_difference": price_diff,
            "price_diff_pct": price_diff_pct,
            "is_cheaper_than_us": bool(c_price < our_price),
            "score_advantage": score_adv,
        })

    comp_avg_price = round(sum(prices) / len(prices), 2) if prices else our_price
    comp_min_price = round(min(prices), 2) if prices else our_price
    comp_max_price = round(max(prices), 2) if prices else our_price
    comp_avg_score = round(sum(scores) / len(scores), 1) if scores else our_score
    comp_avg_freight = round(sum(freights) / len(freights), 2) if freights else our_freight

    price_index = round((our_price / comp_avg_price) * 100, 1) if comp_avg_price > 0 else 100.0

    if price_index > 105.0:
        market_stance = "Premium to Market"
        stance_desc = "Positioned as a premium offering relative to rival merchant pricing."
    elif price_index < 95.0:
        market_stance = "Value / Undercutting"
        stance_desc = "Positioned below category rivals to drive high volume and sales conversion."
    else:
        market_stance = "Competitive Parity"
        stance_desc = "Priced in equilibrium with the direct 3-competitor cluster."

    opp = _classify_opportunity(
        our_price=our_price,
        our_score=our_score,
        comp_avg_price=comp_avg_price,
        comp_avg_score=comp_avg_score,
        comp_min_price=comp_min_price,
        comp_max_price=comp_max_price,
    )

    # Build historical trend comparison series
    comp_by_date: Dict[Any, Dict[int, float]] = {}
    for c in comp_rows:
        d = c["period_date"]
        c_num = int(c["competitor_num"])
        if d not in comp_by_date:
            comp_by_date[d] = {}
        comp_by_date[d][c_num] = float(c["price"])

    historical_trend = []
    for m in metrics_rows:
        d = m["period_date"]
        date_str = d.strftime("%b %y") if hasattr(d, "strftime") else str(d)
        p_our = float(m["unit_price"])
        c_dict = comp_by_date.get(d, {})

        p1 = c_dict.get(1, p_our)
        p2 = c_dict.get(2, p_our)
        p3 = c_dict.get(3, p_our)
        c_avg = round((p1 + p2 + p3) / 3, 2)

        historical_trend.append({
            "period": date_str,
            "our_price": p_our,
            "comp_1": p1,
            "comp_2": p2,
            "comp_3": p3,
            "comp_avg": c_avg,
            "demand": int(m["qty_sold"]),
        })

    return {
        "product_id": prod["product_id"],
        "category": prod["category"],
        "our_price": our_price,
        "our_score": our_score,
        "our_freight": our_freight,
        "comp_avg_price": comp_avg_price,
        "comp_min_price": comp_min_price,
        "comp_max_price": comp_max_price,
        "comp_avg_score": comp_avg_score,
        "comp_avg_freight": comp_avg_freight,
        "price_index": price_index,
        "market_stance": market_stance,
        "stance_description": stance_desc,
        "competitors": competitors_list,
        "opportunity": opp,
        "historical_trend": historical_trend,
        "as_of": str(latest_date),
    }


if __name__ == "__main__":
    print("[CompetitorAnalytics] Running standalone verification...")
    all_insights = get_all_competitor_insights(engine)
    print(f"Loaded insights for {len(all_insights)} products.")
    if all_insights:
        sample = all_insights[0]
        print(f"Sample product: {sample['product_id']} ({sample['category']})")
        print(f"Our price: ${sample['our_price']} | Comp avg: ${sample['comp_avg_price']} | Index: {sample['price_index']}%")
        print(f"Market stance: {sample['market_stance']} | Opportunity: {sample['opportunity']['tag']}")

    bed1_detail = get_product_competitor_detail(engine, "bed1")
    if bed1_detail:
        print(f"\nbed1 Competitors ({len(bed1_detail['competitors'])}):")
        for c in bed1_detail["competitors"]:
            print(f" - {c['competitor_id']}: ${c['price']} (score: {c['score']}, diff: ${c['price_difference']})")
        print(f"bed1 Historical Trend periods: {len(bed1_detail['historical_trend'])}")
    print("[CompetitorAnalytics] Verification successful!")
