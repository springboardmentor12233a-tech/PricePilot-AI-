"""
PricePilot AI — Price Service
==============================
Integrates with the Step 4/5 Price Recommendation Engine to provide model-based
price clearing predictions and candidate alignment recommendations.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

from backend.app.config import settings
from backend.app.schemas import CandidatePriceEvaluation, PricingResponse
from eda.recommend_price import PriceRecommendationEngine

log = logging.getLogger("price_service")


class PriceService:
    """Service layer for price prediction and candidate recommendation."""

    _instance: Optional[PriceService] = None

    def __new__(cls) -> PriceService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        log.info("Initializing PriceService...")
        self.engine = PriceRecommendationEngine(
            model_path=settings.RF_PRICE_MODEL_PATH,
            meta_path=settings.RF_PRICE_META_PATH,
            encoder_source_path=settings.PRICE_ENCODER_PATH,
        )
        self._test_df: Optional[pd.DataFrame] = None
        self._load_reference_data()

    def _load_reference_data(self) -> None:
        """Loads cached evaluation rows for fast context lookup."""
        if settings.TEST_DATA_PATH.exists():
            try:
                log.info("Loading test dataset slice for fast lookups...")
                self._test_df = pd.read_csv(settings.TEST_DATA_PATH)
                self._test_df["item_id"] = self._test_df["item_id"].astype(str)
                self._test_df["store_id"] = self._test_df["store_id"].astype(int)
            except Exception as e:
                log.warning("Could not pre-load test dataset: %s", e)

    def get_price_recommendation(
        self,
        item_id: str,
        store_id: int,
        date: Optional[str] = None,
        candidate_range_pct: float = 0.20,
        candidate_step_pct: float = 0.05,
    ) -> PricingResponse:
        """Computes reference price, model clearing price, and optimal recommendation."""
        item_id_str = str(item_id).strip()
        store_id_int = int(store_id)

        # Lookup context from dataset if available
        context: Optional[pd.Series] = None
        if self._test_df is not None:
            match = self._test_df[
                (self._test_df["item_id"] == item_id_str) & (self._test_df["store_id"] == store_id_int)
            ]
            if not match.empty:
                if date:
                    date_match = match[match["date"] == date]
                    if not date_match.empty:
                        context = date_match.iloc[0]
                if context is None:
                    context = match.iloc[0]

        # If context not found, look up item in any store or construct baseline context
        if context is None and self._test_df is not None:
            item_match = self._test_df[self._test_df["item_id"] == item_id_str]
            if not item_match.empty:
                context = item_match.iloc[0].copy()
                context["store_id"] = store_id_int

        # Fallback synthetic context if item is unseen
        if context is None:
            log.info("Item %s store %d not in pre-loaded panel, constructing standard context", item_id_str, store_id_int)
            context = pd.Series({
                "item_id": item_id_str,
                "store_id": store_id_int,
                "date": date or "2024-08-04",
                "dept_name": "General Grocery",
                "class_name": "Packaged Food",
                "subclass_name": "Standard",
                "item_type": "Standard",
                "division": "Div1",
                "format": "Format-1",
                "city": "City1",
                "area": 1500,
                "price_lag_1": 100.0,
                "price_roll_mean_7": 100.0,
                "is_on_promo": 0,
                "promo_type_code": "None",
                "demand_lag_1": 5.0,
                "demand_lag_7": 5.0,
                "demand_roll_mean_7": 5.0,
            })

        # Run recommendation
        result = self.engine.recommend(
            context,
            min_multiplier=max(0.1, 1.0 - candidate_range_pct),
            max_multiplier=1.0 + candidate_range_pct,
            step_pct=candidate_step_pct,
        )

        # Map candidate summary
        candidates = [
            CandidatePriceEvaluation(
                candidate_price=round(float(c["candidate_price"]), 2),
                percentage_from_ref=round(float(c["percentage_from_ref"]), 2),
                discrepancy_from_model=round(float(c["discrepancy_from_model"]), 2),
                alignment_score=round(float(c["alignment_score"]), 4),
                is_recommended=bool(c["is_recommended"]),
            )
            for c in result.candidates_summary
        ]

        return PricingResponse(
            item_id=str(result.item_id),
            store_id=int(result.store_id),
            date=str(result.date) if result.date else None,
            dept_name=str(result.dept_name),
            class_name=str(result.class_name),
            is_on_promo=int(result.is_on_promo),
            promo_type_code=str(result.promo_type_code),
            reference_price=round(float(result.reference_price), 2),
            reference_source=str(result.reference_source),
            predicted_clearing_price=round(float(result.predicted_expected_price), 2),
            recommended_price=round(float(result.recommended_price), 2),
            price_change_pct=round(float(result.price_change_pct), 2),
            alignment_score=round(float(result.alignment_score), 4),
            candidate_range=[round(float(result.candidate_range[0]), 2), round(float(result.candidate_range[1]), 2)],
            candidate_step=round(float(result.candidate_step), 2),
            num_candidates_evaluated=int(result.num_candidates_evaluated),
            recommendation_reason=str(result.recommendation_reason),
            candidates_summary=candidates,
            metadata={"model_name": "RandomForestRegressor (Step 4)", "objective": "Clearing Price Alignment"},
        )


price_service = PriceService()
