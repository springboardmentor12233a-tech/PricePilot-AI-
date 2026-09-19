from groq import Groq

from app.core.config import settings


def generate_pricing_insight(
    predicted_price: float,
    cost_price: float,
    competitor_price: float,
    discount_pct: float,
    units_sold: int,
    list_price: float,
    market_demand_index: float,
    demand_growth_rate: float,
    inflation_rate: float,
    category: str,
) -> str:

    if not settings.GROQ_API_KEY:
        return "Groq AI is not configured. Add GROQ_API_KEY to backend/.env."

    prompt = f"""
You are a pricing analyst for PricePilot AI.

Analyze the following product pricing data:

Category: {category}
Cost Price: {cost_price}
Current/List Price: {list_price}
Predicted Price: {predicted_price}
Competitor Price: {competitor_price}
Discount: {discount_pct}%
Units Sold: {units_sold}
Market Demand Index: {market_demand_index}
Demand Growth Rate: {demand_growth_rate}
Inflation Rate: {inflation_rate}

Give a concise business recommendation covering:
1. Whether the predicted price looks reasonable.
2. Competitor pricing comparison.
3. Demand situation.
4. One practical pricing recommendation.

Keep the response within 4-5 sentences.
"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise retail pricing analyst."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_completion_tokens=300,
        )

        return response.choices[0].message.content or "No AI insight was generated."

    except Exception as exc:
        return f"Groq AI request failed: {exc}"