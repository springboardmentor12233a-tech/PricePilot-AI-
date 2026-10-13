"""
Orchestrates AI calls: Groq is tried first, Gemini second, and if both
providers are unavailable or fail, a deterministic backend-generated
response is returned so the application keeps working without any LLM.

The LLM is only ever given pre-computed structured metrics (never raw
datasets, never DB access) and is explicitly instructed not to invent
numbers.
"""
from __future__ import annotations

import json
from typing import Optional

from app.ai import gemini_service, groq_service

SYSTEM_PROMPT_RECOMMENDATIONS = """You are PricePilot Copilot, an analytics assistant for a dynamic pricing platform.
You will be given structured, pre-computed metrics (JSON). You must:
- Only reference numbers present in the provided JSON. Never invent metrics, prices, products, or forecasts.
- Clearly distinguish historical/actual data from forecasts and model predictions.
- Never claim a prediction is guaranteed; describe it as an estimate with its stated confidence.
- Return concise, business-actionable pricing/demand/competitor recommendations.
Respond ONLY with a JSON array. Each item must have exactly these keys:
title, category, priority (LOW|MEDIUM|HIGH), reason, recommendation, expected_impact, confidence (0-1 float).
No prose outside the JSON array."""

SYSTEM_PROMPT_CHAT = """You are PricePilot Copilot, an AI assistant embedded in a dynamic pricing & revenue
intelligence platform. You will be given the user's question plus JSON data already retrieved from the
backend (real database/model results). Rules:
- Use ONLY the numbers in the provided JSON context. Never invent or estimate a number that isn't there.
- If the JSON context doesn't contain what's needed to answer, say so plainly instead of guessing.
- Clearly label: "Historical actual" for past data, "Model forecast" for predictions, and
  "AI recommendation" for your own suggestions.
- Start with a direct answer, then add only the most useful supporting details.
- Use plain language and short sentences. Explain technical terms briefly when needed.
- For product or category rankings, use readable names and include relevant revenue or unit figures.
- Never show raw JSON or internal field names to the user.
- Be concise and business-focused."""


def _call_llm(system_prompt: str, user_prompt: str) -> tuple[str, str]:
    """Returns (text, source) where source in {groq, gemini}. Raises if both fail."""
    try:
        if groq_service.is_configured():
            return groq_service.complete(system_prompt, user_prompt), "groq"
    except Exception:  # noqa: BLE001
        pass
    try:
        if gemini_service.is_configured():
            return gemini_service.complete(system_prompt, user_prompt), "gemini"
    except Exception:  # noqa: BLE001
        pass
    raise RuntimeError("Both Groq and Gemini are unavailable")


def generate_recommendations(structured_context: dict) -> tuple[list[dict], str]:
    """Returns (recommendations, source). Falls back to deterministic rules if LLMs fail."""
    user_prompt = f"Structured analytics context:\n{json.dumps(structured_context, default=str)}"
    try:
        text, source = _call_llm(SYSTEM_PROMPT_RECOMMENDATIONS, user_prompt)
        cleaned = text.strip().strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        recs = json.loads(cleaned)
        if isinstance(recs, dict):
            recs = recs.get("recommendations", [])
        return recs, source
    except Exception:  # noqa: BLE001
        return _deterministic_recommendations(structured_context), "deterministic"


def _deterministic_recommendations(ctx: dict) -> list[dict]:
    """Rule-based recommendations computed directly from the metrics, used when
    no LLM provider is available. Guarantees the app works without external AI."""
    recs = []
    kpis = ctx.get("kpis", {})
    competitor = ctx.get("competitor_analysis", [])
    stockouts = ctx.get("stockout_risks", [])

    if kpis.get("profit_margin_pct_estimated", 100) < 10:
        recs.append({
            "title": "Low estimated profit margin",
            "category": "Revenue",
            "priority": "HIGH",
            "reason": f"Estimated profit margin is {kpis.get('profit_margin_pct_estimated')}%, below a healthy 10% threshold.",
            "recommendation": "Review discounting policy and consider price increases on high-demand, low-margin SKUs.",
            "expected_impact": "Improved gross margin without significant demand loss, based on historical elasticity.",
            "confidence": 0.6,
        })
    for row in competitor[:3]:
        if row.get("positioning") == "Above market average":
            recs.append({
                "title": f"{row.get('product_id')} priced above competitors",
                "category": "Competitor",
                "priority": "MEDIUM",
                "reason": f"Price gap of {row.get('price_gap')} versus competitor average {row.get('competitor_avg')}.",
                "recommendation": "Evaluate a price adjustment closer to market average or justify the premium with differentiation messaging.",
                "expected_impact": "Reduced risk of losing price-sensitive customers to competitors.",
                "confidence": 0.55,
            })
    for row in stockouts[:3]:
        recs.append({
            "title": f"Stockout risk: {row.get('product_id')}",
            "category": "Inventory",
            "priority": "HIGH",
            "reason": f"Estimated {row.get('days_of_cover')} days of stock cover remaining at current sell-through.",
            "recommendation": "Expedite restocking or throttle promotional activity for this SKU.",
            "expected_impact": "Avoided lost sales from stockouts.",
            "confidence": 0.65,
        })
    if not recs:
        recs.append({
            "title": "No urgent issues detected",
            "category": "General",
            "priority": "LOW",
            "reason": "Current KPIs, competitor positioning, and inventory levels are within normal ranges.",
            "recommendation": "Continue monitoring; no immediate pricing action required.",
            "expected_impact": "Stable performance.",
            "confidence": 0.5,
        })
    return recs


def answer_chat(question: str, tool_context: dict) -> tuple[str, str]:
    user_prompt = f"User question: {question}\n\nBackend data retrieved for this question:\n{json.dumps(tool_context, default=str)}"
    try:
        text, source = _call_llm(SYSTEM_PROMPT_CHAT, user_prompt)
        return text, source
    except Exception:  # noqa: BLE001
        return _deterministic_chat_answer(question, tool_context), "deterministic"


def _deterministic_chat_answer(question: str, ctx: dict) -> str:
    """Plain-text fallback answer built directly from the retrieved tool data,
    used only when both Groq and Gemini are unavailable."""
    lines = []
    for key, value in ctx.items():
        if key in {"top_products", "worst_products", "category_breakdown"}:
            lines.extend(_format_ranked_results(key, value))
        elif key == "stockout_risks":
            lines.extend(_format_stockout_risks(value))
        elif key == "forecast":
            lines.extend(_format_forecast(value))
        elif key == "pricing_recommendation":
            lines.extend(_format_pricing_recommendation(value))
        elif key == "competitor_prices":
            lines.extend(_format_competitor_prices(value))
        elif key == "note":
            lines.append(str(value))
        else:
            lines.extend(_format_labeled_data(key, value))

    if not lines:
        lines.append("I couldn't find matching information in the available data.")
    lines.append("\nAI providers are unavailable right now; this answer uses retrieved business data.")
    return "\n".join(lines)


def _format_ranked_results(key: str, rows: list[dict]) -> list[str]:
    titles = {
        "top_products": "Top products by revenue",
        "worst_products": "Products with the lowest revenue",
        "category_breakdown": "Revenue by category",
    }
    lines = [f"{titles[key]}:"]
    if not rows:
        return lines + ["No matching records were found."]

    for index, row in enumerate(rows, start=1):
        name = row.get("product_name") or row.get("label") or row.get("product_id") or "Unnamed item"
        details = []
        if row.get("product_id") and row.get("product_name"):
            details.append(row["product_id"])
        if row.get("category"):
            details.append(str(row["category"]))
        if row.get("revenue") is not None:
            details.append(f"revenue {_format_currency(row['revenue'])}")
        if row.get("units") is not None:
            details.append(f"{_format_number(row['units'])} units sold")
        lines.append(f"{index}. {name}" + (f" ({', '.join(details)})" if details else ""))
    return lines


def _format_stockout_risks(rows: list[dict]) -> list[str]:
    lines = ["Products at stockout risk:"]
    if not rows:
        return lines + ["No products are currently below the stockout-risk threshold."]
    for row in rows:
        product = row.get("product_id", "Unknown product")
        cover = row.get("days_of_cover")
        lines.append(f"- {product}: {cover} days of stock cover remaining." if cover is not None else f"- {product}")
    return lines


def _format_forecast(data: dict) -> list[str]:
    if not data or data.get("error"):
        return [str(data.get("error", "No forecast data is available."))]
    horizon = data.get("horizon_days", "requested")
    lines = [f"Demand forecast for {data.get('product_id', 'the product')} over the next {horizon} days:"]
    if data.get("trend"):
        lines.append(f"- Expected trend: {data['trend']}.")
    if data.get("confidence_label"):
        confidence = data.get("confidence_score")
        suffix = f" ({confidence}%)" if confidence is not None else ""
        lines.append(f"- Confidence: {data['confidence_label']}{suffix}.")
    forecast = data.get("forecast", [])
    if forecast:
        first = forecast[0]
        lines.append(f"- First day estimate: {_format_number(first.get('predicted_demand'))} units.")
        lines.append("Forecast values are estimates, not guaranteed results.")
    return lines


def _format_pricing_recommendation(data: dict) -> list[str]:
    if not data or data.get("error"):
        return [str(data.get("error", "No pricing recommendation is available."))]
    lines = [f"Pricing recommendation for {data.get('product_id', 'the product')}:"]
    current = data.get("current_price")
    recommended = data.get("recommended_price")
    if current is not None and recommended is not None:
        lines.append(f"- Current price: {_format_currency(current)}; recommended price: {_format_currency(recommended)}.")
    if data.get("price_change_pct") is not None:
        lines.append(f"- Estimated price change: {data['price_change_pct']}%.")
    if data.get("expected_revenue") is not None:
        lines.append(f"- Estimated revenue at this price: {_format_currency(data['expected_revenue'])}.")
    lines.append("This is a model estimate, not a guaranteed outcome.")
    return lines


def _format_competitor_prices(rows: list[dict]) -> list[str]:
    lines = ["Competitor price comparison:"]
    if not rows:
        return lines + ["No competitor price records were found."]
    for row in rows:
        product = row.get("product_id", "Product")
        average = row.get("competitor_avg")
        positioning = row.get("positioning", "positioning unavailable")
        detail = f"competitor average {_format_currency(average)}" if average is not None else "competitor price unavailable"
        lines.append(f"- {product}: {positioning}; {detail}.")
    return lines


def _format_labeled_data(key: str, value) -> list[str]:
    title = key.replace("_", " ").capitalize()
    if isinstance(value, dict):
        if value.get("has_data") is False:
            return [f"{title}: No data is available."]
        lines = [f"{title}:"]
        for field, item in value.items():
            if field in {"has_data", "historical_tail", "candidate_curve", "validation_metrics"} or item is None:
                continue
            label = field.replace("_", " ").capitalize()
            if isinstance(item, (int, float)):
                if "revenue" in field or "price" in field or "profit" in field or "cost" in field:
                    rendered = _format_currency(item)
                else:
                    rendered = _format_number(item)
                lines.append(f"- {label}: {rendered}.")
            elif isinstance(item, (str, bool)):
                lines.append(f"- {label}: {item}.")
        return lines if len(lines) > 1 else [f"{title}: No summary is available."]
    if isinstance(value, list):
        return [f"{title}: {len(value)} records found."]
    return [f"{title}: {value}."]


def _format_currency(value) -> str:
    return f"${float(value):,.2f}"


def _format_number(value) -> str:
    return f"{float(value):,.2f}".rstrip("0").rstrip(".")
