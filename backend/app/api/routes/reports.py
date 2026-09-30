"""
PricePilot AI — BI Reports Route
================================
REST API endpoint generating real multi-modal business intelligence dossiers
combining live Pricing, Demand Forecasting, Revenue Optimization, Market Analysis,
and AI Insights services.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
import pandas as pd

from backend.app.auth import require_roles
from backend.app.config import settings
from backend.app.schemas import (
    BIReportDateRange,
    BIReportDemandForecast,
    BIReportKeyAction,
    BIReportMarketBenchmark,
    BIReportProductKPIs,
    BIReportResponse,
    BIReportRevenueOptimization,
)
from backend.app.services import (
    competitor_service,
    demand_service,
    insight_service,
    price_service,
    revenue_service,
)

log = logging.getLogger("pricepilot_backend")
router = APIRouter(tags=["BI Reports"])

# RBAC: BI Reports is strictly accessible to BUSINESS_ANALYST (ADMIN and USER blocked)
analyst_only_guard = [Depends(require_roles("BUSINESS_ANALYST"))]

_kpi_cache: Optional[pd.DataFrame] = None


def _get_kpi_row(item_id: str, store_id: int) -> Optional[Dict[str, Any]]:
    global _kpi_cache
    kpi_csv_path = settings.REPORTS_DIR / "kpi_summary.csv"
    if _kpi_cache is None and kpi_csv_path.exists():
        try:
            _kpi_cache = pd.read_csv(kpi_csv_path, dtype={"item_id": str})
        except Exception as e:
            log.warning("Could not read kpi_summary.csv for report context: %s", e)
            return None

    if _kpi_cache is not None:
        matched = _kpi_cache[(_kpi_cache["item_id"] == item_id) & (_kpi_cache["store_id"] == store_id)]
        if not matched.empty:
            return matched.iloc[0].to_dict()
        matched_item = _kpi_cache[_kpi_cache["item_id"] == item_id]
        if not matched_item.empty:
            return matched_item.iloc[0].to_dict()

    return None


@router.get("/reports/generate", response_model=BIReportResponse, dependencies=analyst_only_guard)
def generate_bi_report(
    item_id: str = Query(..., description="Target SKU identifier, e.g. 0022b986c8f0 or 293375605257"),
    store_id: int = Query(1, description="Physical store branch identifier (1, 2, 3, or 4)"),
) -> BIReportResponse:
    """
    Generates a structured, authenticated commercial Business Intelligence Dossier
    aggregating real ML predictions, demand trajectories, revenue elasticity curves,
    and market positioning benchmarks.
    """
    try:
        # 1. Evaluate Pricing recommendation
        pricing_res = price_service.get_price_recommendation(
            item_id=item_id,
            store_id=store_id,
        )

        # 2. Evaluate Demand Forecast
        demand_res = demand_service.forecast_demand(
            item_id=item_id,
            store_id=store_id,
            horizon=30,
        )

        # 3. Evaluate Revenue Optimization
        revenue_res = revenue_service.optimize_revenue(
            item_id=item_id,
            store_id=store_id,
        )

        # 4. Evaluate Market & Competitor Intelligence
        competitor_res = competitor_service.get_market_analysis(
            item_id=item_id,
            store_id=store_id,
        )


        # 5. Evaluate AI Insights
        insight_res = insight_service.generate_insight(
            item_id=item_id,
            store_id=store_id,
        )


        # 6. Retrieve historical baseline from KPI artifact if available
        kpi_row = _get_kpi_row(item_id, store_id) or {}
        class_name = str(kpi_row.get("class_name", pricing_res.class_name or "General Category")).strip()
        dept_name = str(kpi_row.get("dept_name", pricing_res.dept_name or "Retail")).strip()

        units_sold = int(float(kpi_row.get("hist_total_units", round(demand_res.historical_avg_7d * 35))))
        total_revenue = round(float(kpi_row.get("hist_total_revenue", units_sold * pricing_res.reference_price)), 2)

        # Multi-horizon forecast sums
        h7_units = int(round(sum(d.predicted_quantity for d in demand_res.daily_forecasts[:7])))
        h14_units = int(round(sum(d.predicted_quantity for d in demand_res.daily_forecasts[:14])))
        h30_units = int(round(sum(d.predicted_quantity for d in demand_res.daily_forecasts[:30])))

        revenue_lift_potential = round(
            max(0.0, pricing_res.recommended_price - pricing_res.reference_price) * max(1, units_sold),
            2,
        )

        report_id = f"RPT-PP-{item_id[:8].upper()}-{store_id}"
        display_name = f"{class_name} ({item_id})" if class_name and class_name.lower() != "unknown" else f"SKU {item_id}"
        report_title = f"Commercial Intelligence Dossier: {display_name}"

        now_str = datetime.now(timezone.utc).strftime("%B %d, %Y, %H:%M UTC")

        # Channel metrics
        chan_data = competitor_res.internal_digital_channel
        chan_idx = chan_data.channel_price_index if chan_data.channel_price_index is not None else 100.0
        chan_diff = chan_data.channel_price_diff if chan_data.channel_price_diff is not None else 0.0
        is_disparity = chan_data.channel_alignment_status == "DISPARITY"

        # Key Actions derived from actual data
        price_delta_pct = pricing_res.price_change_pct
        action_recs: List[BIReportKeyAction] = [
            BIReportKeyAction(
                action=f"Update Store {store_id} POS shelf price to ${pricing_res.recommended_price:.2f} ({'+' if price_delta_pct >= 0 else ''}{price_delta_pct:.1f}%)",
                owner="Pricing Strategy Ops",

                deadline="Within 48h",
                priority="HIGH" if abs(price_delta_pct) >= 4.0 else "MEDIUM",
            ),
            BIReportKeyAction(
                action=f"Synchronize omnichannel digital channel price table (Index: {chan_idx:.1f}%)",
                owner="E-commerce Channel Manager",
                deadline="Within 72h",
                priority="HIGH" if is_disparity else "LOW",
            ),
            BIReportKeyAction(
                action=f"Align inventory buffer for {demand_res.trend_classification.lower()} demand run-rate (~{demand_res.forecast_avg_7d:.1f} u/d)",
                owner="Merchandising & Replenishment",
                deadline="7 Days Post-Rollout",
                priority="HIGH" if demand_res.trend_classification == "INCREASING" else "MEDIUM",
            ),
            BIReportKeyAction(
                action="Review post-rollout price elasticity and volume variance",
                owner="Business Analyst (Sarah Chen)",
                deadline="14 Days Post-Rollout",
                priority="HIGH",
            ),
        ]

        # Active Alerts derived from real signals
        alerts: List[str] = []
        if is_disparity:
            alerts.append(f"Channel disparity identified: in-store price diverges from online listing by ${chan_diff:.2f}.")
        if demand_res.trend_classification == "DECREASING":
            alerts.append(f"Demand deceleration signal: projected 7-day velocity is {demand_res.trend_change_pct:.1f}% below baseline.")
        elif demand_res.trend_classification == "INCREASING":
            alerts.append(f"Demand acceleration signal: projected 7-day velocity expanding by +{demand_res.trend_change_pct:.1f}%.")
        if competitor_res.pricing_opportunity.opportunity_signal:
            alerts.append(f"Pricing opportunity: {competitor_res.pricing_opportunity.opportunity_signal} ({competitor_res.pricing_opportunity.signal_priority} priority).")
        if not alerts:
            alerts.append("All operational indicators and price parity benchmarks are within normal tolerances.")

        return BIReportResponse(
            reportId=report_id,
            title=report_title,
            generatedDate=now_str,
            author="PricePilot AI System (Business Analyst Session)",
            sku=item_id,
            storeId=store_id,
            dateRange=BIReportDateRange(start="2024-08-04", end="2024-09-08"),
            executiveSummary=insight_res.executive_summary,
            productKpis=BIReportProductKPIs(
                referencePrice=pricing_res.reference_price,
                recommendedPrice=pricing_res.recommended_price,
                clearingPrice=pricing_res.predicted_clearing_price,
                unitsSold=units_sold,
                revenue=total_revenue,
                forecastConfidence=demand_res.confidence_score,
                revenueLift=revenue_lift_potential,
            ),
            pricingAnalysis=pricing_res.recommendation_reason,
            demandForecastSummary=BIReportDemandForecast(
                horizon7d=h7_units,
                horizon14d=h14_units,
                horizon30d=h30_units,
                trend=demand_res.trend_classification,
                risk="MEDIUM" if demand_res.trend_classification == "DECREASING" else "LOW",
            ),
            revenueOptimizationSummary=BIReportRevenueOptimization(
                optimalPrice=revenue_res.optimal_revenue_price,
                expectedRevenue=revenue_res.optimal_expected_revenue,
                liftPercentage=revenue_res.optimal_revenue_lift_pct_vs_ref,
            ),
            marketBenchmarkSummary=BIReportMarketBenchmark(
                channelIndex=chan_idx,
                storeDispersion=competitor_res.cross_store_dispersion.store_price_dispersion_pct,
                marketPosition=competitor_res.market_position.market_position,
            ),


            aiRecommendations=insight_res.actionable_recommendations,
            alerts=alerts,
            keyActions=action_recs,
            _dataSource="LIVE_API",
            _isMock=False,
        )


    except HTTPException:
        raise
    except Exception as e:
        log.error("Failed to compile BI report for SKU %s, Store %d: %s", item_id, store_id, e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate BI Report for SKU '{item_id}': {str(e)}",
        )
