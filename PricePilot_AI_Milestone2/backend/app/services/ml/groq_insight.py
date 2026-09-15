"""
PricePilot AI — Milestone 2
Groq AI Demand Insight Service
================================
Calls Groq LLM (llama-3.3-70b-versatile) to generate:
  1. Market demand intelligence reports
  2. Price optimization recommendations
  3. Competitor analysis narratives
  4. Seasonal demand insights
"""

import os
import json
import logging
from typing import Optional
from groq import Groq

logger = logging.getLogger(__name__)


class GroqInsightService:
    """
    Wraps the Groq API (llama-3.3-70b-versatile) to generate
    AI-powered demand and pricing intelligence insights.
    """

    MODEL = "llama-3.3-70b-versatile"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        if not self.api_key:
            logger.warning(
                "GROQ_API_KEY not set. Groq insight endpoints will return mock data."
            )
        self._client: Optional[Groq] = None
        if self.api_key:
            self._client = Groq(api_key=self.api_key)

    def _chat(self, system_prompt: str, user_prompt: str, temperature: float = 0.4) -> str:
        """Send a chat completion request to Groq."""
        if not self._client:
            return self._mock_response(user_prompt)
        try:
            response = self._client.chat.completions.create(
                model=self.MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=1024,
            )
            return response.choices[0].message.content
        except Exception as exc:
            logger.error(f"Groq API error: {exc}")
            return self._mock_response(user_prompt)

    def _mock_response(self, prompt: str) -> str:
        return (
            "[GROQ_MOCK] Groq API key not configured. "
            "Set the GROQ_API_KEY environment variable to receive real AI insights. "
            f"Prompt received: {prompt[:120]}..."
        )

    # ─── Public Methods ────────────────────────────────────────────────────

    def demand_insight(
        self,
        product_name: str,
        category: str,
        current_price: float,
        predicted_demand: float,
        comp_avg_price: float,
        margin_pct: float,
        is_promotion: bool,
        is_holiday: bool,
    ) -> dict:
        """
        Generate a demand intelligence narrative for a specific product
        using market and pricing data as context.
        """
        system = (
            "You are a senior retail market analyst specializing in dynamic pricing strategy "
            "and demand forecasting for e-commerce retailers. Provide concise, actionable, "
            "data-driven demand insights. Always structure your response in 3 sections: "
            "1. Demand Outlook  2. Key Pricing Signals  3. Recommended Action (1 sentence). "
            "Keep total response under 200 words."
        )
        user = (
            f"Product: {product_name} (Category: {category})\n"
            f"Current Price: ${current_price:.2f}\n"
            f"AI-Predicted Daily Demand: {predicted_demand:.0f} units\n"
            f"Competitor Average Price: ${comp_avg_price:.2f}\n"
            f"Gross Margin: {margin_pct * 100:.1f}%\n"
            f"Active Promotion: {'Yes' if is_promotion else 'No'}\n"
            f"Holiday Period: {'Yes' if is_holiday else 'No'}\n\n"
            "Analyze the demand signals and provide pricing intelligence."
        )
        content = self._chat(system, user)
        return {
            "product": product_name,
            "category": category,
            "insight": content,
            "model_used": self.MODEL,
        }

    def price_optimization_report(
        self,
        product_name: str,
        category: str,
        cost_price: float,
        current_price: float,
        min_price: float,
        max_price: float,
        comp_prices: dict,
        elasticity: float,
        predicted_demand: float,
    ) -> dict:
        """
        Generate an AI-powered price optimization recommendation
        using elasticity and competitor pricing intelligence.
        """
        system = (
            "You are a dynamic pricing AI advisor. Given product pricing data, "
            "competitor intelligence, and demand elasticity, recommend an optimal price "
            "point with clear justification. Format: "
            "1. Recommended Price  2. Expected Demand Impact  3. Revenue Impact  4. Rationale. "
            "Be specific with numbers. Keep under 180 words."
        )
        comp_block = "\n".join([f"  {k}: ${v:.2f}" for k, v in comp_prices.items()])
        user = (
            f"Product: {product_name} | Category: {category}\n"
            f"Unit Cost: ${cost_price:.2f}\n"
            f"Current Price: ${current_price:.2f}\n"
            f"Price Range (Guardrails): ${min_price:.2f} — ${max_price:.2f}\n"
            f"Competitor Prices:\n{comp_block}\n"
            f"Price Elasticity of Demand: {elasticity:.2f}\n"
            f"Current Predicted Daily Demand: {predicted_demand:.0f} units\n\n"
            "Recommend the optimal price point to maximize revenue while staying competitive."
        )
        content = self._chat(system, user)
        return {
            "product": product_name,
            "optimization_report": content,
            "model_used": self.MODEL,
        }

    def seasonal_demand_analysis(
        self,
        category: str,
        month: int,
        avg_demand: float,
        promo_demand_lift_pct: float,
        holiday_demand_lift_pct: float,
        top_products: list[str],
    ) -> dict:
        """
        Generate seasonal demand analysis and proactive pricing guidance
        for a category in a given calendar month.
        """
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ]
        month_name = month_names[month - 1] if 1 <= month <= 12 else str(month)

        system = (
            "You are a retail seasonal strategy consultant. "
            "Provide a concise monthly demand strategy briefing for a product category. "
            "Include: 1. Seasonal Demand Context  2. Promotion Timing Advice  3. Pricing Strategy "
            "for Holiday Periods  4. Top Product Focus. Keep under 200 words."
        )
        user = (
            f"Category: {category} | Month: {month_name}\n"
            f"Average Daily Demand (Baseline): {avg_demand:.0f} units\n"
            f"Promotion Demand Lift: +{promo_demand_lift_pct:.1f}%\n"
            f"Holiday Demand Lift: +{holiday_demand_lift_pct:.1f}%\n"
            f"Top Products in Category: {', '.join(top_products[:5])}\n\n"
            "Generate seasonal demand analysis and pricing strategy."
        )
        content = self._chat(system, user, temperature=0.5)
        return {
            "category": category,
            "month": month_name,
            "seasonal_analysis": content,
            "model_used": self.MODEL,
        }

    def competitor_intelligence_report(
        self,
        product_name: str,
        our_price: float,
        comp_1: float,
        comp_2: float,
        comp_3: float,
        our_margin: float,
        market_share_pct: Optional[float] = None,
    ) -> dict:
        """
        Generate competitor pricing intelligence analysis.
        """
        system = (
            "You are a competitive pricing intelligence analyst. "
            "Analyze our price position versus competitors and recommend action. "
            "Format: 1. Competitive Position  2. Price Gap Analysis  3. Risk Assessment  "
            "4. Recommended Strategy (specific action). Under 160 words."
        )
        avg_comp = (comp_1 + comp_2 + comp_3) / 3
        price_gap = our_price - avg_comp
        user = (
            f"Product: {product_name}\n"
            f"Our Price: ${our_price:.2f} | Our Margin: {our_margin * 100:.1f}%\n"
            f"Competitor 1 (Amazon): ${comp_1:.2f}\n"
            f"Competitor 2 (Walmart): ${comp_2:.2f}\n"
            f"Competitor 3 (Target): ${comp_3:.2f}\n"
            f"Market Average: ${avg_comp:.2f} | Our Price Gap: ${price_gap:+.2f}\n"
            f"Estimated Market Share: {market_share_pct:.1f}%" if market_share_pct else ""
            "\nProvide competitive pricing intelligence report."
        )
        content = self._chat(system, user)
        return {
            "product": product_name,
            "competitive_report": content,
            "our_price": our_price,
            "avg_competitor_price": round(avg_comp, 2),
            "price_advantage": round(-price_gap, 2),
            "model_used": self.MODEL,
        }
