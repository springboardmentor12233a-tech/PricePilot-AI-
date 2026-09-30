"""
PricePilot AI — Competitor / Market Analysis Service
=====================================================
Integrates with the Milestone 3 Step 2 Competitor & Market Analysis Engine
to provide leakage-safe internal digital-channel benchmarks, cross-store dispersion,
category peer pricing, rule-based market position, and pricing opportunity diagnostics.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

from backend.app.config import settings
from backend.app.schemas import (
    ChannelBenchmarkSchema,
    CompetitorResponse,
    MarketPositionSchema,
    OpportunitySignalSchema,
    PeerBenchmarkSchema,
    StoreBenchmarkSchema,
)
from models.competitor.competitor_analysis_engine import CompetitorAnalysisEngine

log = logging.getLogger("competitor_service")


class CompetitorService:
    """Service layer for internal channel and category peer market analysis."""

    _instance: Optional[CompetitorService] = None

    def __new__(cls) -> CompetitorService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        log.info("Initializing CompetitorService...")
        self.engine = CompetitorAnalysisEngine(
            catalog_path=settings.CATALOG_PATH,
            stores_path=settings.STORES_PATH,
            online_path=settings.ONLINE_PATH,
        )
        self._test_df: Optional[pd.DataFrame] = None
        self._analyzed_cache: Optional[pd.DataFrame] = None
        self._load_reference_data()

    def _load_reference_data(self) -> None:
        """Pre-processes sample data with the engine for instant lookups."""
        if settings.TEST_DATA_PATH.exists():
            try:
                log.info("Analyzing baseline test dataset for market lookup cache...")
                df = pd.read_csv(settings.TEST_DATA_PATH)
                analyzed_df, _ = self.engine.analyze_dataframe(df.head(20000))
                analyzed_df["item_id"] = analyzed_df["item_id"].astype(str)
                analyzed_df["store_id"] = analyzed_df["store_id"].astype(int)
                self._analyzed_cache = analyzed_df
            except Exception as e:
                log.warning("Could not pre-populate market analysis cache: %s", e)

    def get_market_analysis(
        self,
        item_id: str,
        store_id: int,
        date: Optional[str] = None,
    ) -> CompetitorResponse:
        """Retrieves market comparison, channel alignment, and opportunity signal."""
        item_id_str = str(item_id).strip()
        store_id_int = int(store_id)

        # Lookup in cache
        row: Optional[pd.Series] = None
        if self._analyzed_cache is not None:
            match = self._analyzed_cache[
                (self._analyzed_cache["item_id"] == item_id_str) & (self._analyzed_cache["store_id"] == store_id_int)
            ]
            if not match.empty:
                if date:
                    date_match = match[match["date"] == date]
                    if not date_match.empty:
                        row = date_match.iloc[0]
                if row is None:
                    row = match.iloc[0]

        # If not cached, analyze single row dynamically
        if row is None:
            df_single = pd.DataFrame([{
                "date": date or "2024-08-04",
                "item_id": item_id_str,
                "store_id": store_id_int,
                "price_base": 100.0,
                "online_price": 100.0,
                "dept_name": "General Grocery",
                "class_name": "Packaged Food",
                "subclass_name": "Standard",
                "item_type": "Standard",
                "is_on_promo": 0,
                "quantity": 5.0,
            }])
            analyzed_single, _ = self.engine.analyze_dataframe(df_single)
            row = analyzed_single.iloc[0]

        # Construct response schemas
        chan = ChannelBenchmarkSchema(
            has_online_listing=bool(row.get("has_online_listing", False)),
            online_price=round(float(row["online_price"]), 2) if pd.notna(row.get("online_price")) else None,
            channel_price_diff=round(float(row["channel_price_diff"]), 2) if pd.notna(row.get("channel_price_diff")) else None,
            channel_price_diff_pct=round(float(row["channel_price_diff_pct"]), 2) if pd.notna(row.get("channel_price_diff_pct")) else None,
            channel_price_index=round(float(row["channel_price_index"]), 4) if pd.notna(row.get("channel_price_index")) else None,
            channel_alignment_status=str(row.get("channel_alignment_status", "NO_ONLINE_LISTING")),
        )

        store_bm = StoreBenchmarkSchema(
            store_count=int(row.get("store_count", 1)),
            store_min_price=round(float(row.get("store_min_price", row["price_base"])), 2),
            store_max_price=round(float(row.get("store_max_price", row["price_base"])), 2),
            store_median_price=round(float(row.get("store_median_price", row["price_base"])), 2),
            store_mean_price=round(float(row.get("store_mean_price", row["price_base"])), 2),
            store_price_range=round(float(row.get("store_price_range", 0.0)), 2),
            store_price_dispersion_pct=round(float(row.get("store_price_dispersion_pct", 0.0)), 2),
            store_vs_median_diff=round(float(row.get("store_vs_median_diff", 0.0)), 2),
            store_vs_median_pct=round(float(row.get("store_vs_median_pct", 0.0)), 2),
        )

        peer_bm = PeerBenchmarkSchema(
            peer_group_level=str(row.get("peer_group_level", "SUBCLASS")),
            peer_count=int(row.get("peer_count", 1)),
            peer_min_price=round(float(row.get("peer_min_price", row["price_base"])), 2),
            peer_max_price=round(float(row.get("peer_max_price", row["price_base"])), 2),
            peer_median_price=round(float(row.get("peer_median_price", row["price_base"])), 2),
            peer_mean_price=round(float(row.get("peer_mean_price", row["price_base"])), 2),
            peer_percentile_rank=round(float(row.get("peer_percentile_rank", 50.0)), 1),
            peer_median_diff=round(float(row.get("peer_median_diff", 0.0)), 2),
            peer_median_diff_pct=round(float(row.get("peer_median_diff_pct", 0.0)), 2),
        )

        pos = MarketPositionSchema(
            market_position=str(row.get("market_position", "Near Peer Benchmark")),
            position_tier=str(row.get("position_tier", "MARKET_ALIGNED")),
            low_threshold_pct=float(self.engine.peer_low_threshold_pct),
            high_threshold_pct=float(self.engine.peer_high_threshold_pct),
            position_rationale=str(row.get("position_rationale", "")),
        )

        opp = OpportunitySignalSchema(
            opportunity_signal=str(row.get("opportunity_signal", "ALIGNED_STABLE")),
            signal_priority=str(row.get("signal_priority", "LOW")),
            opportunity_rationale=str(row.get("opportunity_rationale", "")),
            review_suggested_action=str(row.get("review_suggested_action", "")),
        )

        return CompetitorResponse(
            item_id=item_id_str,
            store_id=store_id_int,
            date=str(row.get("date", date or "2024-08-04")),
            store_price=round(float(row["price_base"]), 2),
            dept_name=str(row.get("dept_name", "General")),
            class_name=str(row.get("class_name", "Standard")),
            subclass_name=str(row.get("subclass_name", "Standard")),
            is_on_promo=int(row.get("is_on_promo", 0)),
            quantity=round(float(row.get("quantity", 1.0)), 2),
            internal_digital_channel=chan,
            cross_store_dispersion=store_bm,
            category_peer_benchmark=peer_bm,
            market_position=pos,
            pricing_opportunity=opp,
            external_competitor_available=bool(row.get("external_competitor_available", False)),
            external_competitor_price=round(float(row["external_competitor_price"]), 2) if pd.notna(row.get("external_competitor_price")) else None,
            external_competitor_index=round(float(row["external_competitor_index"]), 4) if pd.notna(row.get("external_competitor_index")) else None,
        )


competitor_service = CompetitorService()
