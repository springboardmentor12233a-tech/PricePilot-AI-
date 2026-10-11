"""
Conversational chat on top of the existing Groq connection in llm_insights.
Reuses the same client + model so there is one LLM config to maintain.
"""

from sqlalchemy.orm import Session

from app.models.models import Product
from app.services.competitor_analysis import get_competitor_comparison
from app.services.revenue_optimization import compute_elasticity, optimize_price
from app.services.llm_insights import GROQ_MODEL, _get_client, _get_demand_context

SYSTEM_PROMPT = (
    "You are PricePilot AI, an assistant inside a dynamic pricing and revenue "
    "intelligence platform. Help users with price optimization, demand "
    "forecasting, competitor positioning, elasticity, margins and revenue "
    "strategy. Be concise and practical (under 150 words unless asked for more). "
    "Only quote numbers that appear in the data you are given; if you lack data, "
    "say so instead of guessing."
)


def build_product_context(db: Session, product_id: int) -> str | None:
    """Live numbers for one product, as plain text for the system prompt."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    comp = get_competitor_comparison(db, product_id)
    elas = compute_elasticity(db, product_id)
    opt = optimize_price(db, product_id)
    demand = _get_demand_context(db, product_id)

    lines = [f'Product: "{product.name}" (id {product.id})']
    if comp:
        lines.append(
            f"- Our price ${comp['our_price']:.2f} vs competitor avg "
            f"${comp['competitor_avg']:.2f} ({comp['price_gap_pct']:+.1f}%), "
            f"positioning: {comp['positioning']}"
        )
    if elas:
        lines.append(
            f"- Elasticity {elas['elasticity']:.2f} ({elas['interpretation']}), "
            f"R2={elas['r_squared']:.2f}"
        )
    if opt:
        lines.append(
            f"- Recommended price ${opt['recommended_price']:.2f} "
            f"({opt['recommended_price_change_pct']:+.0f}% from ${opt['current_price']:.2f}), "
            f"expected revenue uplift {opt['expected_revenue_uplift_pct']:+.1f}%"
        )
    if demand:
        lines.append(
            f"- Demand trend: {demand['trend']} (confidence {demand['confidence_score']:.0f}%)"
        )
    return "\n".join(lines)


def chat_completion(messages: list[dict]) -> str:
    """Single place that talks to Groq for chat. Tests mock this function."""
    client = _get_client()
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=1000,  # headroom: gpt-oss is a reasoning model
        )
    except Exception as e:
        raise RuntimeError(f"Groq API request failed: {e}") from e

    text = (response.choices[0].message.content or "").strip()
    if not text:
        raise RuntimeError("The AI returned an empty response. Please try again.")
    return text