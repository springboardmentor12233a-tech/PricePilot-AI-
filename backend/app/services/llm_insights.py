"""
AI-Generated Pricing Insights Module (mentor requirement #3: "external
llm connection through api key, either groq or gemini").

IMPORTANT -- what this module does NOT do: it runs no new analysis and
makes no pricing decisions. It takes numbers your OTHER modules already
computed (competitor gap, elasticity, optimal price) and asks an LLM to
narrate them in plain English. The intelligence is still yours; the LLM's
job here is explanation, not decision-making -- an honest thing to say
if a reviewer asks what this module actually contributes.

Setup:
    pip install groq
    Add GROQ_API_KEY=your_key_here to your .env file
    (free key: https://console.groq.com)
"""

import os

from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

from app.models.models import Product, DemandForecast
from app.services.competitor_analysis import get_competitor_comparison
from app.services.revenue_optimization import compute_elasticity, optimize_price

load_dotenv()

GROQ_MODEL = "qwen/qwen3.8-27b"

_client: Groq | None = None


def _get_client() -> Groq:
    """
    Loaded once, reused across requests.
    """
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to your .env file -- "
                "get a free key at https://console.groq.com"
            )
        _client = Groq(api_key=api_key)
    return _client


def _get_demand_context(db: Session, product_id: int) -> dict | None:
    forecast = (
        db.query(DemandForecast)
        .filter(DemandForecast.product_id == product_id)
        .order_by(DemandForecast.id.desc())
        .first()
    )
    if not forecast:
        return None
    return {
        "trend": forecast.trend,
        "confidence_score": forecast.confidence_score,
    }


def _build_prompt(
    product_name: str,
    competitor: dict | None,
    elasticity: dict | None,
    optimization: dict | None,
    demand: dict | None,
) -> str:
    lines = [
        f'You are a pricing analyst assistant. Write a short (3-5 sentence), '
        f'plain-English explanation of the pricing situation for the product '
        f'"{product_name}", based ONLY on the data below. Be direct and '
        f"specific with the numbers given. Do not invent any data not listed here.",
        "",
    ]

    if competitor:
        lines.append(
            f"- Competitor position: our price is ${competitor['our_price']:.2f}, "
            f"competitor average is ${competitor['competitor_avg']:.2f} "
            f"({competitor['price_gap_pct']:+.1f}% gap), classified as "
            f"\"{competitor['positioning']}\"."
        )
    else:
        lines.append("- Competitor position: no competitor data available for this product.")

    if elasticity:
        lines.append(
            f"- Price elasticity: {elasticity['elasticity']:.2f} "
            f"({elasticity['interpretation']}), fit quality R2="
            f"{elasticity['r_squared']:.2f} on {elasticity['data_points_used']} data points."
        )
    else:
        lines.append("- Price elasticity: not enough historical data to estimate.")

    if optimization:
        lines.append(
            f"- Revenue optimization: recommended price change is "
            f"{optimization['recommended_price_change_pct']:+.0f}% "
            f"(${optimization['current_price']:.2f} -> ${optimization['recommended_price']:.2f}), "
            f"projected revenue uplift {optimization['expected_revenue_uplift_pct']:+.1f}%."
        )
    else:
        lines.append("- Revenue optimization: not enough historical data to estimate.")

    if demand:
        lines.append(
            f"- Demand forecast trend: {demand['trend']} "
            f"(confidence {demand['confidence_score']:.0f}%)."
        )
    else:
        lines.append("- Demand forecast: not available for this specific product.")

    return "\n".join(lines)


def generate_pricing_insight(db: Session, product_id: int) -> dict | None:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    competitor = get_competitor_comparison(db, product_id)
    elasticity = compute_elasticity(db, product_id)
    optimization = optimize_price(db, product_id)
    demand = _get_demand_context(db, product_id)

    prompt = _build_prompt(product.name, competitor, elasticity, optimization, demand)

    client = _get_client()
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=250,
        )
    except Exception as e:
        raise RuntimeError(f"Groq API request failed: {e}") from e

    narrative = response.choices[0].message.content.strip()

    return {
        "product_id": product.id,
        "product_name": product.name,
        "narrative": narrative,
        "based_on": {
            "competitor": competitor,
            "elasticity": elasticity,
            "optimization": optimization,
            "demand": demand,
        },
    }