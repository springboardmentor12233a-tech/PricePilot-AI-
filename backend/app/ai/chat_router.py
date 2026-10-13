"""
Very deliberately NOT an LLM-generated-SQL router. This is a small, auditable
keyword-based intent classifier that decides which backend analytical tool(s)
from chat_tools.py to call for a given question, plus a product-id extractor.
The LLM only ever sees the tool outputs -- it cannot query the database itself.
"""
from __future__ import annotations

import re
from typing import Optional

from sqlalchemy.orm import Session

from app.ai import chat_tools

PRODUCT_ID_PATTERN = re.compile(r"\bP\d{3,5}\b", re.IGNORECASE)


def extract_product_id(question: str) -> Optional[str]:
    match = PRODUCT_ID_PATTERN.search(question)
    return match.group(0).upper() if match else None


def route(db: Session, question: str) -> dict:
    q = question.lower()
    product_id = extract_product_id(question)
    context: dict = {}

    if "top" in q and "revenue" in q or "best selling" in q or "top revenue" in q:
        context["top_products"] = chat_tools.get_top_products(db, n=5)
    if "declining" in q or "decreasing demand" in q or "worst" in q or "underperform" in q:
        context["worst_products"] = chat_tools.get_worst_products(db, n=5)
    if "compet" in q:
        if product_id:
            context["competitor_prices"] = chat_tools.get_competitor_prices(db, product_id)
        else:
            context["category_breakdown"] = chat_tools.get_category_breakdown(db)
    if "forecast" in q or "next" in q and ("day" in q or "demand" in q):
        horizon = 30
        for token in ["7", "14", "30", "90", "180", "365"]:
            if token in q:
                horizon = int(token)
                break
        if product_id:
            context["forecast"] = chat_tools.get_product_forecast(db, product_id, horizon)
    if "price should" in q or "recommend" in q and "price" in q or "what price" in q:
        if product_id:
            context["pricing_recommendation"] = chat_tools.get_pricing_recommendation(db, product_id)
    if "stockout" in q or "stock out" in q or "inventory risk" in q:
        context["stockout_risks"] = chat_tools.get_stockout_risks(db)
    if "category" in q and "revenue" in q:
        context["category_breakdown"] = chat_tools.get_category_breakdown(db)
    if "why did revenue" in q or "revenue decline" in q or "revenue drop" in q:
        context["revenue_trend"] = chat_tools.get_revenue_trends(db)
    if "alert" in q:
        context["note"] = "Fetch current alerts via GET /api/alerts; this chat tool summarises only."

    if product_id and "kpi" not in context:
        context["product_kpis"] = chat_tools.get_product_kpis(db, product_id)
        context["product_price"] = chat_tools.get_product_price(db, product_id)

    if not context:
        # generic fallback: give overall KPIs so the assistant has *something* grounded to reference
        from app.services import analytics_service
        context["overall_kpis"] = analytics_service.get_kpis(db)

    return context
