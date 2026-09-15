"""
PricePilot AI — Milestone 2
Unified LLM Service: Groq + Gemini
====================================
Supports:
  Groq API   : llama-3.3-70b-versatile  (free tier, very fast)
  Gemini API : gemini-2.0-flash          (free tier, high quality)

How to get keys:
  Groq   -> https://console.groq.com/      (GROQ_API_KEY=gsk_...)
  Gemini -> https://aistudio.google.com/   (GEMINI_API_KEY=AIza...)

Set in backend/.env:
  GROQ_API_KEY=gsk_your_key_here
  GEMINI_API_KEY=AIza_your_key_here
"""

import os
import logging
from typing import Optional, Literal
import httpx

logger = logging.getLogger(__name__)
ProviderType = Literal["groq", "gemini"]


class LLMService:
    """
    Unified wrapper for Groq and Gemini LLM APIs.
    Falls back to mock responses when API key is not set.
    """

    GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
    GEMINI_URL   = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    GROQ_MODEL   = "llama-3.3-70b-versatile"
    GEMINI_MODEL = "gemini-2.0-flash"

    def __init__(self, provider: ProviderType = "groq", api_key: Optional[str] = None):
        self.provider = provider
        if api_key:
            self.api_key = api_key
        else:
            env_var = "GROQ_API_KEY" if provider == "groq" else "GEMINI_API_KEY"
            self.api_key = os.environ.get(env_var, "")
        if not self.api_key:
            logger.warning(f"[LLMService] {provider.upper()} API key not set — running in mock mode")

    def _call(self, system_prompt: str, user_prompt: str, max_tokens: int = 600) -> str:
        """Send LLM request to the selected provider."""
        if not self.api_key:
            return self._mock(user_prompt)
        try:
            if self.provider == "groq":
                return self._groq_call(system_prompt, user_prompt, max_tokens)
            else:
                return self._gemini_call(system_prompt, user_prompt, max_tokens)
        except Exception as exc:
            logger.error(f"[LLMService] {self.provider} call failed: {exc}")
            return f"[LLM Error] {exc} — Check your {self.provider.upper()} API key."

    def _groq_call(self, system: str, user: str, max_tokens: int) -> str:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                self.GROQ_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                    "temperature": 0.4,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    def _gemini_call(self, system: str, user: str, max_tokens: int) -> str:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{self.GEMINI_URL}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": f"{system}\n\n{user}"}]}],
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": max_tokens,
                    },
                },
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _mock(self, user_prompt: str) -> str:
        return (
            "[MOCK MODE] No API key configured.\n"
            "Set GROQ_API_KEY (from console.groq.com) or\n"
            "GEMINI_API_KEY (from aistudio.google.com) in backend/.env\n\n"
            f"Prompt received (first 200 chars): {user_prompt[:200]}..."
        )

    # ─── Public Methods ───────────────────────────────────────────────

    def demand_insight(
        self,
        product: str,
        category: str,
        price: float,
        demand: float,
        comp_avg: float,
        margin: float,
        is_promo: bool = False,
        is_holiday: bool = False,
    ) -> dict:
        """Generate AI demand intelligence narrative."""
        system = (
            "You are a senior retail pricing analyst. Analyze the product data and respond "
            "in exactly 4 sections:\n"
            "1. Demand Outlook\n2. Key Pricing Signals\n"
            "3. Competitor Strategy\n4. Recommended Action (with specific numbers)\n"
            "Keep under 220 words. Be concrete and actionable."
        )
        user = (
            f"Product: {product} ({category})\n"
            f"Current Price: ${price:.2f}\n"
            f"AI-Predicted Daily Demand: {demand:.0f} units\n"
            f"Competitor Avg Price: ${comp_avg:.2f}\n"
            f"Price Advantage vs Market: ${comp_avg - price:+.2f}\n"
            f"Gross Margin: {margin:.1f}%\n"
            f"Active Promotion: {'Yes' if is_promo else 'No'}\n"
            f"Holiday Period: {'Yes' if is_holiday else 'No'}\n\n"
            "Generate demand intelligence report."
        )
        return {
            "product":  product,
            "category": category,
            "provider": self.provider,
            "model":    self.GROQ_MODEL if self.provider == "groq" else self.GEMINI_MODEL,
            "insight":  self._call(system, user),
        }

    def price_optimize(
        self,
        product: str,
        category: str,
        cost: float,
        price: float,
        price_min: float,
        price_max: float,
        comp_prices: dict,
        elasticity: float,
        demand: float,
    ) -> dict:
        """Generate AI price optimization recommendation."""
        system = (
            "You are a dynamic pricing optimizer. Recommend optimal price with justification.\n"
            "Format: 1. Recommended Price  2. Demand Impact  3. Revenue Impact  4. Rationale\n"
            "Be specific with numbers. Under 180 words."
        )
        comp_str = ", ".join([f"{k}: ${v:.2f}" for k, v in comp_prices.items()])
        user = (
            f"Product: {product} ({category})\n"
            f"Unit Cost: ${cost:.2f} | Current Price: ${price:.2f}\n"
            f"Price Range: ${price_min:.2f} to ${price_max:.2f}\n"
            f"Competitors: {comp_str}\n"
            f"Price Elasticity: {elasticity:.2f} | Predicted Daily Demand: {demand:.0f} units\n\n"
            "Recommend optimal price to maximize revenue."
        )
        return {
            "product":      product,
            "provider":     self.provider,
            "model":        self.GROQ_MODEL if self.provider == "groq" else self.GEMINI_MODEL,
            "optimization": self._call(system, user),
        }

    def competitor_report(
        self,
        product: str,
        our_price: float,
        comp_1: float,
        comp_2: float,
        comp_3: float,
        our_margin: float,
    ) -> dict:
        """Generate competitor intelligence report."""
        avg_comp = (comp_1 + comp_2 + comp_3) / 3
        system = (
            "You are a competitive pricing analyst. Analyze price position vs competitors.\n"
            "Format: 1. Competitive Position  2. Price Gap Analysis  3. Risk  4. Strategy\n"
            "Under 160 words."
        )
        user = (
            f"Product: {product}\n"
            f"Our Price: ${our_price:.2f} | Our Margin: {our_margin:.1f}%\n"
            f"Competitor 1: ${comp_1:.2f}\n"
            f"Competitor 2: ${comp_2:.2f}\n"
            f"Competitor 3: ${comp_3:.2f}\n"
            f"Market Avg: ${avg_comp:.2f} | Gap: ${our_price - avg_comp:+.2f}\n\n"
            "Provide competitor intelligence report."
        )
        return {
            "product":           product,
            "provider":          self.provider,
            "our_price":         our_price,
            "avg_competitor":    round(avg_comp, 2),
            "price_gap":         round(our_price - avg_comp, 2),
            "report":            self._call(system, user),
        }

    def seasonal_analysis(
        self,
        category: str,
        month: int,
        avg_demand: float,
        promo_lift_pct: float,
        holiday_lift_pct: float,
        top_products: list,
    ) -> dict:
        """Generate seasonal demand strategy."""
        month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        month_name = month_names[month - 1] if 1 <= month <= 12 else str(month)
        system = (
            "You are a retail seasonal strategy consultant. Generate monthly demand strategy.\n"
            "Format: 1. Seasonal Context  2. Promotion Timing  3. Holiday Pricing  4. Product Focus\n"
            "Under 190 words."
        )
        user = (
            f"Category: {category} | Month: {month_name}\n"
            f"Avg Daily Demand (baseline): {avg_demand:.0f} units\n"
            f"Promotion Demand Lift: +{promo_lift_pct:.1f}%\n"
            f"Holiday Demand Lift: +{holiday_lift_pct:.1f}%\n"
            f"Top Products: {', '.join(top_products[:5])}\n\n"
            "Generate seasonal demand analysis and pricing strategy."
        )
        return {
            "category": category,
            "month":    month_name,
            "provider": self.provider,
            "model":    self.GROQ_MODEL if self.provider == "groq" else self.GEMINI_MODEL,
            "analysis": self._call(system, user),
        }
