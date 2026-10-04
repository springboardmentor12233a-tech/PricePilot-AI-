"""
Groq LLM Proxy and Structured Recommendation Engine.
Grounded in real econometric model outputs from model_registry.
Falls back safely to cached/deterministic real model summaries without inventing fake numbers.
"""

import os
import json
from typing import Dict, Any, Optional, List
import httpx
from app.core.config import settings
from app.services.data_loader import get_all_products, get_product_by_id
from app.ml.model_registry import registry


def _generate_fallback_recommendation(product: Dict[str, Any]) -> Dict[str, Any]:
    gap = product.get("price_gap_pct", 0.0)
    conf = product.get("confidence_score", 32.8)
    stock = product.get("stock_status", "In Stock")
    rec_price = product.get("recommended_price", product["current_price"])
    coef = product.get("elasticity_coef", registry.elasticity_coef)

    if conf < 30.0:
        return {
            "action": "investigate",
            "recommended_price": rec_price,
            "reasoning": f"Model confidence R² is exceptionally low ({conf:.1f}%). Transaction frequency is sparse, requiring human pricing analyst review before automated adjustment.",
            "urgency": "high",
            "expected_impact": "Prevents catastrophic margin leakage from unverified price cuts.",
        }
    elif gap < -15.0:
        return {
            "action": "reduce price",
            "recommended_price": rec_price,
            "reasoning": f"Current price is {abs(gap):.1f}% above competitive parity. Lowering price to ${rec_price:,.2f} stimulates high demand elasticity (beta = {coef:.2f}) to recover market share.",
            "urgency": "high" if stock == "Critical" else "medium",
            "expected_impact": f"Projected volume expansion with estimated ${product['predicted_revenue'] - product['revenue_this_month']:+,.2f} revenue improvement.",
        }
    elif gap < -2.0:
        return {
            "action": "reduce price",
            "recommended_price": rec_price,
            "reasoning": f"A targeted price trim to ${rec_price:,.2f} aligns product with benchmark competitors without degrading brand perception.",
            "urgency": "medium",
            "expected_impact": "Stabilizes weekly unit velocity against rival promotional campaigns.",
        }
    elif gap > 3.0:
        return {
            "action": "increase price",
            "recommended_price": rec_price,
            "reasoning": f"Product pricing power allows a +${rec_price - product['current_price']:.2f} adjustment to capture incremental margin given low cross-price elasticity.",
            "urgency": "medium",
            "expected_impact": f"Expands margin by +{(rec_price - product['current_price'])/rec_price * 100:.1f}% with negligible volume loss.",
        }
    else:
        return {
            "action": "hold",
            "recommended_price": rec_price,
            "reasoning": "Product pricing is optimal at current market clearing levels. Current price is within 2% of competitor benchmarks.",
            "urgency": "low",
            "expected_impact": "Maintains predictable cash flow and steady inventory turnover.",
        }


async def generate_product_insight(product_id: str) -> Dict[str, Any]:
    product = get_product_by_id(product_id)
    if not product:
        return {}

    fallback = _generate_fallback_recommendation(product)
    api_key = os.environ.get("GROQ_API_KEY") or settings.GROQ_API_KEY

    # If Groq API key is configured, call Groq with grounded real data
    if api_key and len(api_key.strip()) > 5:
        try:
            prompt = f"""You are PricePilot AI's Chief Econometrician.
Analyze this real electronics product:
Product: {product['name']} (Category: {product['category']})
Current Price: ${product['current_price']}
Recommended Price: ${product['recommended_price']} (Gap: {product['price_gap_pct']}%)
Cost Price: ${product['cost_price']}
Competitor Price: ${product['competitor_price']}
Units Sold: {product['units_sold']}
Monthly Revenue: ${product['revenue_this_month']}
Demand Trend: {product['demand_trend']}
Confidence Score (R2): {product['confidence_score']}%
Elasticity Beta: {product.get('elasticity_coef', registry.elasticity_coef)}

Provide a structured recommendation JSON with exact keys:
{{
  "action": "reduce price" | "increase price" | "hold" | "investigate",
  "reasoning": "2-3 sentences explaining economic rationale tied to price elasticity and competitor delta",
  "urgency": "low" | "medium" | "high",
  "expected_impact": "1 sentence on expected revenue or volume impact"
}}
Return ONLY valid JSON.
"""
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key.strip()}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": "You output only valid JSON. Never invent numbers."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                        "max_tokens": 300,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    if content.startswith("```"):
                        content = content.strip("`").replace("json", "").strip()
                    parsed = json.loads(content)
                    return {
                        "product_id": product["id"],
                        "product_name": product["name"],
                        "llm_summary": parsed.get("reasoning", product.get("llm_summary")),
                        "recommendation": {
                            "action": parsed.get("action", fallback["action"]),
                            "recommended_price": product["recommended_price"],
                            "reasoning": parsed.get("reasoning", fallback["reasoning"]),
                            "urgency": parsed.get("urgency", fallback["urgency"]),
                            "expected_impact": parsed.get("expected_impact", fallback["expected_impact"]),
                        },
                        "source": "groq",
                    }
        except Exception as e:
            print(f"[Groq LLM Proxy Error] {e} - falling back to real cached model summary")

    # Safe deterministic fallback using real model summary
    return {
        "product_id": product["id"],
        "product_name": product["name"],
        "llm_summary": product.get("llm_summary", fallback["reasoning"]),
        "recommendation": fallback,
        "source": "deterministic-engine",
    }


async def answer_chat_query(question: str, context_product_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Hybrid Chatbot: Answers fast factual questions locally, routes open-ended strategic queries
    to Groq LLM grounded strictly in real product data.
    """
    q_lower = question.lower().strip()
    products = get_all_products()
    api_key = os.environ.get("GROQ_API_KEY") or settings.GROQ_API_KEY

    # Rule 1: Product price lookup
    for p in products:
        p_name = p["name"].lower()
        if (p["id"].lower() in q_lower) or any(tok in q_lower for tok in p_name.split() if len(tok) > 4):
            if any(term in q_lower for term in ["price", "cost", "recommend", "gap", "margin"]):
                return {
                    "answer": (
                        f"**{p['name']}** currently retails at **${p['current_price']:,.2f}**. "
                        f"Our elasticity model recommends **${p['recommended_price']:,.2f}** "
                        f"({p['price_gap_pct']:+.1f}% adjustment). Competitor benchmark sits at ${p['competitor_price']:,.2f}. "
                        f"Model confidence is **{p['confidence_score']:.1f}%** with {p['demand_trend']}."
                    ),
                    "source": "local-rule-engine",
                    "suggestions": [
                        f"Why is {p['name'].split()[0]} recommended at ${p['recommended_price']}?",
                        "What is our overall revenue lift potential?",
                        "Which products have the biggest price gaps?",
                    ],
                }

    # Rule 2: Elasticity & Model background inquiry
    if any(term in q_lower for term in ["elasticity", "r2", "r^2", "dataset", "ols", "regression", "how does"]):
        return {
            "answer": (
                f"Price elasticity in PricePilot AI is grounded in an empirical **fixed-effects OLS regression** "
                f"on Dataset 1 (price gap coefficient **{registry.elasticity_coef:.3f}**, p={registry.p_value:.4f}, "
                f"R²={registry.model_r_squared:.3f}). Demand forecasts are calculated deterministically via rolling "
                f"linear regressions per SKU."
            ),
            "source": "local-rule-engine",
            "suggestions": [
                "Show all products with high urgency",
                "What is the average price gap across the portfolio?",
                "Which product has the highest revenue?",
            ],
        }

    # Rule 3: General KPI / revenue question
    if any(term in q_lower for term in ["revenue", "kpi", "sales", "lift", "portfolio"]):
        total_rev = sum(p["revenue_this_month"] for p in products)
        total_pred = sum(p["predicted_revenue"] for p in products)
        lift = total_pred - total_rev
        return {
            "answer": (
                f"Current monthly electronics portfolio revenue is **${total_rev:,.2f}**. "
                f"Implementing AI price recommendations projects **${total_pred:,.2f}**, representing "
                f"an incremental lift of **${lift:+,.2f}** (+{(lift/total_rev)*100:.1f}%)."
            ),
            "source": "local-rule-engine",
            "suggestions": [
                "Which products need urgent price changes?",
                "Can I download a BI executive report?",
                "Explain model confidence and elasticity",
            ],
        }

    # If Groq is available, ask Groq with real product grounding
    if api_key and len(api_key.strip()) > 5:
        try:
            grounding_text = "\n".join([
                f"- {p['name']} ({p['category']}): Current ${p['current_price']}, Rec ${p['recommended_price']} ({p['price_gap_pct']}%), Comp ${p['competitor_price']}, Stock: {p['stock_status']}, Trend: {p['demand_trend']}, Conf: {p['confidence_score']}%"
                for p in products
            ])
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key.strip()}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are PricePilot AI Assistant. Answer concisely and professionally using "
                                    f"this real product data:\n{grounding_text}\n"
                                    "Always ground your response strictly in these numbers. Never fabricate metrics."
                                ),
                            },
                            {"role": "user", "content": question},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 250,
                    },
                )
                if resp.status_code == 200:
                    ans = resp.json()["choices"][0]["message"]["content"].strip()
                    return {
                        "answer": ans,
                        "source": "groq-llm",
                        "suggestions": [
                            "Show price comparison",
                            "Explain model confidence and elasticity",
                            "Which products have high urgency alerts?",
                        ],
                    }
        except Exception as e:
            print(f"[Groq Chat Error] {e}")

    # Default fallback answer
    return {
        "answer": (
            "PricePilot AI is monitoring 8 core electronics SKUs across Audio, Laptops, Smartphones, Displays, and Cameras. "
            "You can ask me about specific product recommendations, competitor gaps, demand forecasts, or overall portfolio revenue lift."
        ),
        "source": "local-rule-engine",
        "suggestions": [
            "What is the recommended price for Sony WH-1000XM5?",
            "Explain model confidence and elasticity",
            "What alerts are active?",
        ],
    }
