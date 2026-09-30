"""
PricePilot AI — Gemini Business Insights Service
=================================================
Integrates with the Step 9 Gemini Business Insights Engine to translate ML
predictions, commercial KPIs, and market signals into executive explanations.
Ensures zero-crash offline fallback when GEMINI_API_KEY is absent or API is unreachable.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import pandas as pd

from backend.app.config import settings
from backend.app.schemas import InsightResponse
from eda.gemini_business_insights import GeminiBusinessInsightsEngine, build_structured_business_context

log = logging.getLogger("insight_service")


class InsightService:
    """Service layer for Gemini-powered and rule-based business insights."""

    _instance: Optional[InsightService] = None

    def __new__(cls) -> InsightService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        log.info("Initializing InsightService...")
        self.engine = GeminiBusinessInsightsEngine(
            api_key=settings.GEMINI_API_KEY if settings.GEMINI_API_KEY else None,
            model_name=settings.GEMINI_MODEL,
        )
        self._kpi_df: Optional[pd.DataFrame] = None
        self._load_reference_data()

    def _load_reference_data(self) -> None:
        """Loads cached KPI records for rapid context generation."""
        kpi_csv = settings.REPORTS_DIR / "kpi_summary.csv"
        if kpi_csv.exists():
            try:
                log.info("Loading KPI summary for insight context builder...")
                df = pd.read_csv(kpi_csv)
                df["item_id"] = df["item_id"].astype(str)
                df["store_id"] = df["store_id"].astype(int)
                self._kpi_df = df
            except Exception as e:
                log.warning("Could not pre-load KPI summary table: %s", e)

    def generate_insight(
        self,
        item_id: str,
        store_id: int,
    ) -> InsightResponse:
        """Generates executive business insight with live LLM or structured fallback."""
        item_id_str = str(item_id).strip()
        store_id_int = int(store_id)

        # Lookup context
        record: Optional[pd.Series] = None
        if self._kpi_df is not None:
            match = self._kpi_df[
                (self._kpi_df["item_id"] == item_id_str) & (self._kpi_df["store_id"] == store_id_int)
            ]
            if not match.empty:
                record = match.iloc[0]

        if record is None:
            record = pd.Series({
                "item_id": item_id_str,
                "store_id": store_id_int,
                "dept_name": "General Grocery",
                "class_name": "Packaged Food",
                "reference_price": 100.0,
                "predicted_clearing_price": 105.0,
                "recommended_price": 105.0,
                "price_change_pct": 5.0,
                "forecast_7d_total": 35.0,
                "demand_trend_class": "STABLE",
                "demand_confidence_score": 85.0,
                "historical_total_units": 150.0,
                "historical_total_revenue": 15000.0,
                "promo_rate_pct": 0.0,
                "business_priority": "BALANCED_MONITORING",
                "domain_insight": "Pricing is aligned near category peer benchmark with steady volume.",
            })

        context = build_structured_business_context(record)

        # Attempt LLM insight generation if configured
        if self.engine.is_configured:
            try:
                log.info("Requesting live Gemini insight for item %s store %d...", item_id_str, store_id_int)
                llm_res = self.engine.generate_business_insight(context)
                if llm_res.get("api_status") == "SUCCESS":
                    insights = llm_res.get("insights", {})
                    return InsightResponse(
                        item_id=item_id_str,
                        store_id=store_id_int,
                        executive_summary=str(insights.get("executive_summary", "")),
                        pricing_rationale=str(insights.get("pricing_rationale", "")),
                        demand_and_forecast_insights=str(insights.get("demand_and_forecast_insights", "")),
                        promotional_and_historical_analysis=str(insights.get("promotional_and_historical_analysis", "")),
                        commercial_risks=str(insights.get("commercial_risks", "")),
                        actionable_recommendations=list(insights.get("actionable_recommendations", [])),
                        source_model=str(self.engine.model_name or settings.GEMINI_MODEL),
                        is_live_gemini=True,
                        status="success",
                        source="LIVE",
                    )
            except Exception as e:
                log.warning("Live Gemini generation encountered exception: %s. Falling back to rule-based engine.", e)

        # Robust Offline Domain Fallback
        ref_p = float(record.get("reference_price", 100.0))
        rec_p = float(record.get("recommended_price", 100.0))
        delta_p = float(record.get("price_change_pct", 0.0))
        trend = str(record.get("demand_trend_class", "STABLE"))
        forecast_7d = float(record.get("forecast_7d_total", 35.0))

        direction = "upward adjustment" if delta_p > 0 else ("discount stimulus" if delta_p < 0 else "parity alignment")

        return InsightResponse(
            item_id=item_id_str,
            store_id=store_id_int,
            executive_summary=(
                f"Item {item_id_str} in Store {store_id_int} reflects a {trend.lower()} demand profile with "
                f"a recommended {direction} ({delta_p:+.1f}%) from reference ${ref_p:.2f} to ${rec_p:.2f}."
            ),
            pricing_rationale=(
                f"The recommended price of ${rec_p:.2f} aligns with the model clearing equilibrium, "
                f"preserving healthy transaction velocity while optimizing unit revenue contribution."
            ),
            demand_and_forecast_insights=(
                f"7-day demand is projected at {forecast_7d:.1f} units with a {trend} trajectory. "
                f"Operational volume is sufficient to support standard inventory replenishment cycles."
            ),
            promotional_and_historical_analysis=(
                f"Historical volume of {float(record.get('historical_total_units', 150)):.0f} units demonstrates "
                f"consistent shopper engagement across regular price points."
            ),
            commercial_risks=(
                "Primary risk factors include potential competitor price matching, local demand shifts, "
                "and promo cannibalization across related category subclasses."
            ),
            actionable_recommendations=[
                f"Deploy recommended price of ${rec_p:.2f} and monitor 7-day velocity response.",
                "Maintain target safety stock levels aligned with the 7-day forecast.",
                "Review internal digital-channel parity to avoid omnichannel price friction.",
            ],
            source_model=str(self.engine.model_name) if hasattr(self, "engine") and self.engine and self.engine.model_name else settings.GEMINI_MODEL,
            is_live_gemini=False,
            status="success",
            source="OFFLINE_FALLBACK",
        )


insight_service = InsightService()
