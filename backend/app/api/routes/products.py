"""
PricePilot AI — Product Catalog Route
=====================================
REST API endpoints serving real SKU-level product KPI catalog records
derived from the KPI summary artifact (eda/reports/kpi_summary.csv).
"""

from __future__ import annotations

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from backend.app.config import settings
from backend.app.schemas import ProductPerformanceItem

log = logging.getLogger("pricepilot_backend")
router = APIRouter(tags=["Products"])

_cached_products: Optional[List[ProductPerformanceItem]] = None


def _load_products_from_kpi() -> List[ProductPerformanceItem]:
    """
    Loads and caches real SKU-level performance metrics from eda/reports/kpi_summary.csv.
    """
    global _cached_products
    if _cached_products is not None:
        return _cached_products

    kpi_csv_path = settings.REPORTS_DIR / "kpi_summary.csv"
    if not kpi_csv_path.exists():
        log.warning("kpi_summary.csv not found at %s", kpi_csv_path)
        return []

    try:
        df = pd.read_csv(kpi_csv_path, dtype={"item_id": str})
        items: List[ProductPerformanceItem] = []

        for _, row in df.iterrows():
            item_id = str(row.get("item_id", "")).strip()
            dept_name = str(row.get("dept_name", "General")).strip()
            class_name = str(row.get("class_name", "")).strip()

            if class_name and class_name.lower() != "unknown" and class_name != dept_name:
                name = f"{class_name} ({item_id})"
            else:
                name = f"SKU {item_id}"

            ref_price = float(row.get("reference_price", row.get("hist_avg_price", 0.0)))
            rec_price = float(row.get("recommended_price", ref_price))
            pred_price = float(row.get("predicted_clearing_price", ref_price))
            units = int(float(row.get("hist_total_units", 0.0)))
            revenue = round(float(row.get("hist_total_revenue", 0.0)), 2)
            avg_demand = round(float(row.get("hist_avg_daily_demand", 0.0)), 2)
            forecast_demand = round(float(row.get("forecast_avg_7d", 0.0)), 2)
            conf_score = round(float(row.get("confidence_score", 85.0)), 1)

            trend_val = str(row.get("trend", "STABLE")).strip().upper()
            if trend_val not in ("INCREASING", "STABLE", "DECREASING"):
                trend_val = "STABLE"

            price_chg_pct = round(float(row.get("price_change_pct", 0.0)), 2)
            rev_opp = round(max(0.0, rec_price - ref_price) * units, 2)

            prio = str(row.get("confidence_tier", "MEDIUM")).strip().upper()
            if prio not in ("HIGH", "MEDIUM", "LOW"):
                prio = "MEDIUM"

            if price_chg_pct < -2.0:
                pos = "BELOW"
            elif price_chg_pct > 2.0:
                pos = "ABOVE"
            else:
                pos = "NEAR"

            items.append(
                ProductPerformanceItem(
                    sku=item_id,
                    name=name,
                    category=dept_name,
                    storeId=int(row.get("store_id", 1)),
                    currentPrice=round(ref_price, 2),
                    recommendedPrice=round(rec_price, 2),
                    predictedPrice=round(pred_price, 2),
                    unitsSold=units,
                    revenue=revenue,
                    avgDemand=avg_demand,
                    forecastDemand=forecast_demand,
                    forecastConfidence=conf_score,
                    demandTrend=trend_val,
                    revenueOpportunity=rev_opp,
                    revenueOpportunityPct=price_chg_pct,
                    priority=prio,
                    marketPosition=pos,
                    channelParityStatus="PARITY",
                )
            )

        _cached_products = items
        log.info("Loaded %d real product records from %s", len(items), kpi_csv_path)
        return _cached_products
    except Exception as e:
        log.error("Failed to load products from kpi_summary.csv: %s", e)
        return []


@router.get("/products", response_model=List[ProductPerformanceItem])
def get_products(
    store_id: Optional[int] = Query(None, description="Filter by store ID"),
    dept_name: Optional[str] = Query(None, description="Filter by category/department"),
    item_id: Optional[str] = Query(None, description="Filter by SKU/item_id"),
    limit: Optional[int] = Query(None, description="Limit number of returned products"),
) -> List[ProductPerformanceItem]:
    """
    Returns real SKU-level product KPI catalog records derived from the KPI summary artifact.
    """
    products = _load_products_from_kpi()
    if not products:
        return []

    filtered = products
    if store_id is not None:
        filtered = [p for p in filtered if p.storeId == store_id]
    if dept_name and dept_name.upper() != "ALL":
        filtered = [p for p in filtered if dept_name.lower() in p.category.lower()]
    if item_id:
        filtered = [p for p in filtered if item_id.lower() in p.sku.lower()]

    if limit is not None and limit > 0:
        filtered = filtered[:limit]

    return filtered


@router.get("/products/{sku}", response_model=ProductPerformanceItem)
def get_product_by_sku(
    sku: str,
    store_id: Optional[int] = Query(None, description="Store ID for the SKU"),
) -> ProductPerformanceItem:
    """
    Returns real KPI metadata for a specific SKU and optional store.
    """
    products = _load_products_from_kpi()
    for p in products:
        if p.sku == sku:
            if store_id is None or p.storeId == store_id:
                return p

    raise HTTPException(status_code=404, detail=f"Product with SKU '{sku}' not found.")
