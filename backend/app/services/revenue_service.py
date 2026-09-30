"""
PricePilot AI — Revenue Service
================================
Integrates with the Milestone 3 Step 1 Revenue Optimization Engine to simulate
discrete pricing candidate curves and maximize expected daily and multi-horizon revenue.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

from backend.app.config import settings
from backend.app.schemas import CandidateRevenueItem, RevenueResponse
from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

log = logging.getLogger("revenue_service")


class RevenueService:
    """Service layer for model-driven expected revenue optimization."""

    _instance: Optional[RevenueService] = None

    def __new__(cls) -> RevenueService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        log.info("Initializing RevenueService...")
        self.engine = RevenueOptimizationEngine(
            demand_model_path=settings.LGBM_DEMAND_MODEL_PATH,
            demand_meta_path=settings.LGBM_DEMAND_META_PATH,
            price_model_path=settings.RF_PRICE_MODEL_PATH,
            price_meta_path=settings.RF_PRICE_META_PATH,
            encoder_path=settings.PRICE_ENCODER_PATH,
        )
        self._test_df: Optional[pd.DataFrame] = None
        self._load_reference_data()

    def _load_reference_data(self) -> None:
        """Loads cached evaluation rows for fast context lookup."""
        if settings.TEST_DATA_PATH.exists():
            try:
                self._test_df = pd.read_csv(settings.TEST_DATA_PATH)
                self._test_df["item_id"] = self._test_df["item_id"].astype(str)
                self._test_df["store_id"] = self._test_df["store_id"].astype(int)
            except Exception as e:
                log.warning("Could not pre-load test dataset: %s", e)

    def optimize_revenue(
        self,
        item_id: str,
        store_id: int,
        date: Optional[str] = None,
        candidate_range_pct: float = 0.20,
        candidate_step_pct: float = 0.05,
    ) -> RevenueResponse:
        """Simulates candidate price points and finds revenue-maximizing price."""
        item_id_str = str(item_id).strip()
        store_id_int = int(store_id)

        # Lookup context
        context: Optional[pd.Series] = None
        if self._test_df is not None:
            match = self._test_df[
                (self._test_df["item_id"] == item_id_str) & (self._test_df["store_id"] == store_id_int)
            ]
            if not match.empty:
                context = match.iloc[0]

        if context is None and self._test_df is not None:
            item_match = self._test_df[self._test_df["item_id"] == item_id_str]
            if not item_match.empty:
                context = item_match.iloc[0].copy()
                context["store_id"] = store_id_int

        if context is None:
            context = pd.Series({
                "item_id": item_id_str,
                "store_id": store_id_int,
                "date": date or "2024-08-04",
                "dept_name": "General Grocery",
                "class_name": "Packaged Food",
                "price_lag_1": 100.0,
                "price_roll_mean_7": 100.0,
                "demand_lag_1": 5.0,
                "demand_roll_mean_7": 5.0,
                "online_price": 100.0,
                "has_online_listing": 1,
                "is_on_promo": 0,
            })

        # Run optimization
        result = self.engine.optimize_revenue_for_item(
            context,
            min_multiplier=max(0.1, 1.0 - candidate_range_pct),
            max_multiplier=1.0 + candidate_range_pct,
            step_pct=candidate_step_pct,
        )

        candidates = [
            CandidateRevenueItem(
                candidate_price=round(float(c["candidate_price"]), 2),
                percentage_from_ref=round(float(c["percentage_from_ref"]), 2),
                predicted_daily_demand=round(float(c["predicted_daily_demand"]), 2),
                expected_daily_revenue=round(float(c["expected_daily_revenue"]), 2),
                revenue_lift_vs_ref_pct=round(float(c["revenue_lift_vs_ref_pct"]), 2),
                revenue_lift_vs_rec_pct=round(float(c["revenue_lift_vs_rec_pct"]), 2),
                is_revenue_optimal=bool(c["is_revenue_optimal"]),
                is_clearing_recommended=bool(c["is_clearing_recommended"]),
            )
            for c in result.candidates_summary
        ]

        return RevenueResponse(
            item_id=str(result.item_id),
            store_id=int(result.store_id),
            date=str(result.date) if result.date else None,
            dept_name=str(result.dept_name),
            class_name=str(result.class_name),
            reference_price=round(float(result.reference_price), 2),
            reference_source=str(result.reference_source),
            reference_expected_demand=round(float(result.reference_expected_demand), 2),
            reference_expected_revenue=round(float(result.reference_expected_revenue), 2),
            predicted_clearing_price=round(float(result.predicted_clearing_price), 2),
            clearing_recommended_price=round(float(result.clearing_recommended_price), 2),
            clearing_expected_demand=round(float(result.clearing_expected_demand), 2),
            clearing_expected_revenue=round(float(result.clearing_expected_revenue), 2),
            optimal_revenue_price=round(float(result.optimal_revenue_price), 2),
            optimal_expected_demand=round(float(result.optimal_expected_demand), 2),
            optimal_expected_revenue=round(float(result.optimal_expected_revenue), 2),
            optimal_price_change_pct_from_ref=round(float(result.optimal_price_change_pct_from_ref), 2),
            optimal_price_change_pct_from_rec=round(float(result.optimal_price_change_pct_from_rec), 2),
            optimal_revenue_lift_pct_vs_ref=round(float(result.optimal_revenue_lift_pct_vs_ref), 2),
            optimal_revenue_lift_pct_vs_rec=round(float(result.optimal_revenue_lift_pct_vs_rec), 2),
            optimal_demand_change_pct_vs_ref=round(float(result.optimal_demand_change_pct_vs_ref), 2),
            candidate_range=[round(float(result.candidate_range[0]), 2), round(float(result.candidate_range[1]), 2)],
            num_candidates_evaluated=int(result.num_candidates_evaluated),
            optimization_rationale=str(result.optimization_rationale),
            candidates_summary=candidates,
        )


revenue_service = RevenueService()
