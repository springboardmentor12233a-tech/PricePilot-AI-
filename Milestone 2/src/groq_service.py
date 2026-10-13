"""
groq_service.py
----------------
All Groq LLM integration lives here. Python/pandas already calculated every
number (see kpi_engine.py); Groq is only ever asked to EXPLAIN numbers it is
given, never to invent them.

Architecture:
    CSV -> pandas -> kpi_engine -> build_business_context() -> Groq -> answer

Model:
    Default model id is "openai/gpt-oss-120b" (Groq's production-tier
    flagship model as of the GroqCloud docs at console.groq.com/docs/models,
    checked September 2026). Groq deprecates/replaces models periodically —
    if this id stops working, check console.groq.com/docs/models and update
    GROQ_MODEL below or via the GROQ_MODEL env var.

Security:
    The API key is read only from the environment (GROQ_API_KEY, normally
    loaded from a local .env file via python-dotenv). It is never printed,
    logged, hardcoded, or sent to the frontend.
"""

from __future__ import annotations

import json
import os

from dotenv import load_dotenv

load_dotenv()  # reads .env if present; does nothing on servers where the
                # variable is already set in the real environment

GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

SYSTEM_PROMPT = """You are an AI Business Intelligence Analyst for a retail business.

You analyze verified business KPIs, customer activity, product performance,
competitor pricing and ML predictions.

Rules you must always follow:
- Use only the business data provided in the context below. Never invent
  numerical values.
- If information needed to answer is not present in the context, clearly
  say that the information is unavailable rather than guessing.
- Explain insights in simple, non-technical business language.
- When appropriate, structure your answer as:
  1. Finding
  2. Reason
  3. Business impact
  4. Recommendation
- Do not claim that correlation proves causation.
- Clearly distinguish between actual historical results (from the data) and
  ML model predictions (which are estimates, not facts).
- Keep answers concise and business-focused; use bullet points for lists.
"""


def _get_client():
    """Create a Groq client. Returns None (never raises) if the key is missing."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"[groq_service] Could not create Groq client: {e}")
        return None


def is_available() -> bool:
    """Lets the dashboard show a graceful 'AI assistant offline' state."""
    return _get_client() is not None


# --------------------------------------------------------------------------
# BUSINESS CONTEXT BUILDER
# --------------------------------------------------------------------------
def build_business_context(kpi_report: dict, ml_metrics: dict | None = None) -> str:
    """
    Collects the already-calculated KPIs + ML metrics into a compact JSON
    string that gets attached to every question sent to Groq. Nothing here
    is computed by the LLM — it is all produced by kpi_engine.py /
    ml_prediction.py beforehand.
    """
    ml_metrics = ml_metrics or {}

    context = {
        "total_revenue": kpi_report.get("total_revenue"),
        "total_profit": kpi_report.get("total_profit"),
        "total_cost": kpi_report.get("total_cost"),
        "profit_margin_pct": kpi_report.get("profit_margin_pct"),
        "total_units_sold": kpi_report.get("total_units_sold"),
        "avg_selling_price": kpi_report.get("avg_selling_price"),
        "avg_discount_pct": kpi_report.get("avg_discount_pct"),
        "customer_views": kpi_report.get("customer_views"),
        "add_to_cart_count": kpi_report.get("add_to_cart_count"),
        "purchases": kpi_report.get("purchases"),
        "conversion_rate_pct": kpi_report.get("conversion_rate_pct"),
        "stockout_rate_pct": kpi_report.get("stockout_rate_pct"),
        "avg_our_price": kpi_report.get("avg_our_price"),
        "avg_competitor_price": kpi_report.get("avg_competitor_price"),
        "price_difference_vs_competitor": kpi_report.get("price_difference_vs_competitor"),
        "revenue_growth": kpi_report.get("revenue_growth"),
        "profit_growth": kpi_report.get("profit_growth"),
        "revenue_by_category": kpi_report.get("revenue_by_category"),
        "revenue_by_channel": kpi_report.get("revenue_by_channel"),
        "top_products_by_revenue": kpi_report.get("top_products_by_revenue"),
        "top_products_by_profit": kpi_report.get("top_products_by_profit"),
        "monthly_trend_last_6": (kpi_report.get("monthly_trend") or [])[-6:],
        "stockout_by_category": kpi_report.get("stockout_by_category"),
        "ml_model": {
            "best_model_name": ml_metrics.get("best_model_name", "Not available"),
            "mae": ml_metrics.get("mae"),
            "rmse": ml_metrics.get("rmse"),
            "r2": ml_metrics.get("r2"),
        },
    }
    return json.dumps(context, default=str, indent=2)


# --------------------------------------------------------------------------
# ASK AI (chat-style Q&A)
# --------------------------------------------------------------------------
def ask_ai(question: str, kpi_report: dict, ml_metrics: dict | None = None,
           latest_prediction: float | None = None) -> str:
    """
    Sends the user's question + the compact business context to Groq.
    Returns the assistant's text answer, or a graceful fallback message
    if Groq is unavailable / the call fails.
    """
    client = _get_client()
    if client is None:
        return ("⚠️ The AI Business Assistant is currently unavailable "
                "(GROQ_API_KEY not configured). All KPIs and charts above "
                "are still fully accurate — they come directly from your data.")

    context_str = build_business_context(kpi_report, ml_metrics)
    prediction_note = (
        f"\n\nMost recent ML prediction requested by the user (if any): {latest_prediction}"
        if latest_prediction is not None else ""
    )

    user_message = (
        f"BUSINESS CONTEXT (JSON, all values pre-calculated from real data):\n"
        f"{context_str}{prediction_note}\n\n"
        f"QUESTION: {question}"
    )

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=900,
        )
        return response.choices[0].message.content
    except Exception as e:
        return (f"⚠️ The AI Business Assistant could not reach Groq right now "
                f"({e.__class__.__name__}). Please try again in a moment. "
                f"KPIs and charts are unaffected.")


# --------------------------------------------------------------------------
# GENERATE FULL BUSINESS REPORT
# --------------------------------------------------------------------------
REPORT_SECTIONS = [
    "Executive Summary", "Revenue Performance", "Profit Performance",
    "Customer Performance", "Product Performance", "Competitor Analysis",
    "ML Prediction Summary", "Key Problems", "Business Recommendations",
    "Conclusion",
]


def generate_report(kpi_report: dict, ml_metrics: dict | None = None) -> str:
    client = _get_client()
    if client is None:
        return ("⚠️ Report generation requires the AI Business Assistant "
                "(GROQ_API_KEY not configured). You can still view every "
                "KPI and chart in the dashboard sections above.")

    context_str = build_business_context(kpi_report, ml_metrics)
    sections_list = "\n".join(f"{i+1}. {s}" for i, s in enumerate(REPORT_SECTIONS))

    prompt = (
        f"BUSINESS CONTEXT (JSON, all values pre-calculated from real data):\n"
        f"{context_str}\n\n"
        f"Using ONLY the numbers in the context above, write a professional "
        f"business report with exactly these sections, in this order:\n"
        f"{sections_list}\n\n"
        f"Use markdown headings (##) for each section. Reference real figures "
        f"from the context wherever relevant. If a section cannot be "
        f"filled because the data is unavailable, say so briefly instead of "
        f"inventing numbers."
    )

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return response.choices[0].message.content
    except Exception as e:
        return (f"⚠️ Report generation failed ({e.__class__.__name__}). "
                f"Please check your GROQ_API_KEY and internet connection, "
                f"then try again.")
