"""
PricePilot AI — Milestone 3 Step 1: Revenue Optimization Engine
==============================================================

Implements the model-driven Revenue Optimization Engine by coupling the
Step 6 LightGBM demand forecasting model with the Step 4 Random Forest price
clearing model.

Core Mathematical Formulation & Methodology:
--------------------------------------------
1. Reference & Candidate Space:
   - Identifies baseline reference price P_ref from historical price lags (without
     using contemporaneous target price_base to prevent data leakage).
   - Generates discrete candidate pricing grid C = {P_1, P_2, ..., P_K} around P_ref
     (e.g., -20% to +20% in configurable steps).

2. Demand Estimation Under Candidate Pricing:
   - For each candidate price P_c in C:
     Constructs simulation state with price_base = P_c and consistent derived
     channel features (e.g. price_ratio_to_online = P_c / online_price).
   - Uses the Step 6 LightGBM demand model to predict expected demand:
         Q_hat(P_c) = max(0, LightGBM(X(P_c)))

3. Expected Revenue Calculation:
   - Computes expected daily revenue:
         ExpRev_daily(P_c) = P_c * Q_hat(P_c)
   - Optionally computes multi-horizon expected revenue (7-day, 14-day, 30-day):
         ExpRev_horizon(P_c) = P_c * sum_{t=1..H} Q_hat_t(P_c)

4. Revenue Optimization & Dual-Price Retention:
   - Revenue-Maximizing Price:
         P*_rev = argmax_{P_c in C} ExpRev(P_c)
   - Clearing-Aligned Recommended Price:
         P*_rec = argmin_{P_c in C} |P_c - P_model_clearing|
   - Retains both P*_rev and P*_rec alongside P_ref to enable commercial tradeoff
     analysis between equilibrium clearing alignment vs pure revenue maximization.

5. Domain Integrity & Guardrails:
   - Strictly avoids fabricating product cost or profit metrics.
   - All optimizations optimize Expected Revenue = candidate_price * predicted_demand.

Outputs:
  models/revenue/revenue_optimization_engine.py  (this engine implementation)
  models/revenue/revenue_engine_meta.joblib      (engine configuration metadata)
  eda/reports/revenue_optimization_examples.csv  (sample revenue optimization table)
  eda/reports/revenue_optimization_examples.json (structured JSON examples)
  eda/reports/milestone3_step1_revenue_optimization_report.md (Step 1 report)
"""

from __future__ import annotations

import json
import logging
import math
import sys
import time
import warnings
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import OrdinalEncoder

# Dynamically import lightgbm
try:
    import lightgbm as lgb
except ImportError as exc:
    raise ImportError("LightGBM is required. Install with `pip install lightgbm`.") from exc

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("revenue_optimization_engine")

# ---------------------------------------------------------------------------
# Project Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = ROOT_DIR / "models"
REVENUE_DIR = MODELS_DIR / "revenue"
PRICE_DIR = MODELS_DIR / "price"
DEMAND_DIR = MODELS_DIR / "demand"
PROCESSED_DIR = ROOT_DIR / "Datasets" / "processed"
REPORTS_DIR = ROOT_DIR / "eda" / "reports"

# Default Model Paths
DEFAULT_DEMAND_MODEL_PATH = DEMAND_DIR / "lgbm_demand_step6.txt"
DEFAULT_DEMAND_META_PATH = DEMAND_DIR / "lgbm_demand_step6_meta.joblib"
DEFAULT_PRICE_MODEL_PATH = PRICE_DIR / "rf_price_step4.joblib"
DEFAULT_PRICE_META_PATH = PRICE_DIR / "rf_price_step4_meta.joblib"
DEFAULT_ENCODER_PATH = PRICE_DIR / "ridge_pipeline.joblib"
DEFAULT_TEST_DATA_PATH = PROCESSED_DIR / "test_data.csv.gz"

REVENUE_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Leakage-Safe Feature Constants
FORBIDDEN_PRICE_FEATURES = [
    "price_base",
    "sale_price_before_promo",
    "sale_price_time_promo",
    "online_price",
    "promo_discount_amount",
    "promo_discount_pct",
    "price_ratio_to_online",
    "has_online_listing",
]


# ---------------------------------------------------------------------------
# Data Structures
# ---------------------------------------------------------------------------
@dataclass
class CandidateRevenueEvaluation:
    candidate_price: float
    percentage_from_ref: float
    predicted_daily_demand: float
    expected_daily_revenue: float
    predicted_7d_demand: Optional[float] = None
    expected_7d_revenue: Optional[float] = None
    predicted_14d_demand: Optional[float] = None
    expected_14d_revenue: Optional[float] = None
    predicted_30d_demand: Optional[float] = None
    expected_30d_revenue: Optional[float] = None
    implied_elasticity_vs_ref: Optional[float] = None
    revenue_lift_vs_ref_pct: float = 0.0
    revenue_lift_vs_rec_pct: float = 0.0
    demand_change_vs_ref_pct: float = 0.0
    is_revenue_optimal: bool = False
    is_clearing_recommended: bool = False


@dataclass
class RevenueOptimizationResult:
    item_id: str
    store_id: int
    date: Optional[str]
    dept_name: str
    class_name: str
    reference_price: float
    reference_source: str
    reference_expected_demand: float
    reference_expected_revenue: float
    predicted_clearing_price: float
    clearing_recommended_price: float
    clearing_expected_demand: float
    clearing_expected_revenue: float
    optimal_revenue_price: float
    optimal_expected_demand: float
    optimal_expected_revenue: float
    optimal_price_change_pct_from_ref: float
    optimal_price_change_pct_from_rec: float
    optimal_revenue_lift_pct_vs_ref: float
    optimal_revenue_lift_pct_vs_rec: float
    optimal_demand_change_pct_vs_ref: float
    optimal_demand_change_pct_vs_rec: float
    candidate_range: Tuple[float, float]
    candidate_step_pct: float
    num_candidates_evaluated: int
    optimization_rationale: str
    candidates_evaluations: List[CandidateRevenueEvaluation]
    candidates_summary: List[Dict[str, Any]]


@dataclass
class RevenueOptimizationBatchSummary:
    total_items_optimized: int
    total_daily_expected_revenue_ref: float
    total_daily_expected_revenue_clearing: float
    total_daily_expected_revenue_optimal: float
    portfolio_revenue_lift_pct_vs_ref: float
    portfolio_revenue_lift_pct_vs_clearing: float
    avg_reference_price: float
    avg_clearing_recommended_price: float
    avg_optimal_revenue_price: float
    total_daily_demand_ref: float
    total_daily_demand_optimal: float
    portfolio_demand_change_pct: float
    results: List[RevenueOptimizationResult]


# ---------------------------------------------------------------------------
# Revenue Optimization Engine
# ---------------------------------------------------------------------------
class RevenueOptimizationEngine:
    """
    Model-driven Revenue Optimization Engine for PricePilot AI.
    Integrates existing Step 6 LightGBM demand model and Step 4 Random Forest
    price clearing model to simulate demand and maximize expected revenue.
    """

    def __init__(
        self,
        demand_model_path: Path = DEFAULT_DEMAND_MODEL_PATH,
        demand_meta_path: Path = DEFAULT_DEMAND_META_PATH,
        price_model_path: Path = DEFAULT_PRICE_MODEL_PATH,
        price_meta_path: Path = DEFAULT_PRICE_META_PATH,
        encoder_path: Path = DEFAULT_ENCODER_PATH,
    ):
        self.demand_model_path = Path(demand_model_path)
        self.demand_meta_path = Path(demand_meta_path)
        self.price_model_path = Path(price_model_path)
        self.price_meta_path = Path(price_meta_path)
        self.encoder_path = Path(encoder_path)

        self.demand_booster: Optional[lgb.Booster] = None
        self.demand_meta: Dict[str, Any] = {}
        self.demand_features: List[str] = []
        self.demand_cat_cols: List[str] = []

        self.price_model = None
        self.price_meta: Dict[str, Any] = {}
        self.price_features: List[str] = []
        self.price_cat_cols: List[str] = []
        self.price_encoder: Optional[OrdinalEncoder] = None

        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads all serialized model artifacts and verifies schema integrity."""
        # 1. Load Demand Model (LightGBM)
        log.info("Loading Step 6 Demand Model from: %s", self.demand_model_path)
        if not self.demand_model_path.exists():
            raise FileNotFoundError(f"Demand model file not found: {self.demand_model_path}")
        self.demand_booster = lgb.Booster(model_file=str(self.demand_model_path))

        log.info("Loading Step 6 Demand Metadata from: %s", self.demand_meta_path)
        if not self.demand_meta_path.exists():
            raise FileNotFoundError(f"Demand metadata file not found: {self.demand_meta_path}")
        self.demand_meta = joblib.load(self.demand_meta_path)
        self.demand_features = self.demand_meta.get("all_features", [])
        self.demand_cat_cols = self.demand_meta.get("cat_features", [])

        # 2. Load Price Model (RandomForest)
        log.info("Loading Step 4 Price Model from: %s", self.price_model_path)
        if not self.price_model_path.exists():
            raise FileNotFoundError(f"Price model file not found: {self.price_model_path}")
        self.price_model = joblib.load(self.price_model_path)

        log.info("Loading Step 4 Price Metadata from: %s", self.price_meta_path)
        if self.price_meta_path.exists():
            self.price_meta = joblib.load(self.price_meta_path)
            self.price_features = self.price_meta.get("all_features", [])
            self.price_cat_cols = self.price_meta.get("cat_features", [])
        else:
            self.price_features = list(getattr(self.price_model, "feature_names_in_", []))
            self.price_cat_cols = [c for c in self.demand_cat_cols if c in self.price_features]

        # 3. Load Categorical Encoder for Price Model
        if self.encoder_path.exists():
            log.info("Loading categorical encoder from: %s", self.encoder_path)
            ridge_pipe = joblib.load(self.encoder_path)
            prep = ridge_pipe.named_steps.get("prep")
            if prep:
                cat_step = prep.named_transformers_.get("cat")
                if cat_step and "ordinal" in cat_step.named_steps:
                    self.price_encoder = cat_step.named_steps["ordinal"]

        if self.price_encoder is None:
            log.warning("Encoder not found in pipeline; instantiating OrdinalEncoder fallback.")
            self.price_encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)

        log.info("Revenue Optimization Engine initialized successfully.")

    def establish_reference_price(
        self,
        context: Union[pd.Series, Dict[str, Any]],
        fallback_global_median: float = 89.90,
    ) -> Tuple[float, str]:
        """
        Determines the baseline reference price without using the target `price_base`.
        Priority:
          1. price_lag_1 (yesterday's price)
          2. price_roll_mean_7 (7-day rolling mean price)
          3. price_lag_7 (7 days ago price)
          4. fallback_global_median
        """
        ctx_dict = context.to_dict() if isinstance(context, pd.Series) else dict(context)

        lag_1 = ctx_dict.get("price_lag_1")
        if lag_1 is not None and not pd.isna(lag_1) and float(lag_1) > 0:
            return float(lag_1), "price_lag_1"

        roll_7 = ctx_dict.get("price_roll_mean_7")
        if roll_7 is not None and not pd.isna(roll_7) and float(roll_7) > 0:
            return float(roll_7), "price_roll_mean_7"

        lag_7 = ctx_dict.get("price_lag_7")
        if lag_7 is not None and not pd.isna(lag_7) and float(lag_7) > 0:
            return float(lag_7), "price_lag_7"

        return float(fallback_global_median), "fallback_global_median"

    def generate_candidate_prices(
        self,
        reference_price: float,
        min_multiplier: float = 0.80,
        max_multiplier: float = 1.20,
        step_pct: float = 0.02,
        custom_candidates: Optional[List[float]] = None,
        round_cents: bool = True,
    ) -> List[float]:
        """
        Generates candidate prices around the reference price or uses custom list.
        """
        if custom_candidates is not None and len(custom_candidates) > 0:
            candidates = [round(float(p), 2) for p in custom_candidates if float(p) > 0]
            return sorted(list(set(candidates)))

        if reference_price <= 0:
            reference_price = 10.0

        multipliers = np.arange(min_multiplier, max_multiplier + (step_pct / 2.0), step_pct)
        raw_candidates = reference_price * multipliers

        candidates = []
        for p in raw_candidates:
            val = round(float(p), 2) if round_cents else float(p)
            if val > 0 and val not in candidates:
                candidates.append(val)

        ref_rounded = round(reference_price, 2)
        if ref_rounded not in candidates and ref_rounded > 0:
            candidates.append(ref_rounded)

        return sorted(candidates)

    def predict_clearing_price(self, context: Union[pd.Series, Dict[str, Any]]) -> float:
        """
        Predicts expected clearing price using the Step 4 Random Forest model.
        """
        ctx_dict = context.to_dict() if isinstance(context, pd.Series) else dict(context)
        df = pd.DataFrame([ctx_dict])

        for col in self.price_features:
            if col not in df.columns:
                df[col] = 0.0

        cat_present = [c for c in self.price_cat_cols if c in df.columns]
        if cat_present and self.price_encoder is not None:
            df_cat = df[cat_present].astype(str)
            try:
                df[cat_present] = self.price_encoder.transform(df_cat)
            except Exception:
                enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
                df[cat_present] = enc.fit_transform(df_cat)

        X = df[self.price_features].astype("float32")
        pred = float(self.price_model.predict(X)[0])
        return max(0.01, pred)

    def predict_daily_demand(
        self,
        context: Union[pd.Series, Dict[str, Any]],
        candidate_price: float,
    ) -> float:
        """
        Predicts daily unit demand for a specific candidate price using LightGBM.
        """
        sim_state = dict(context.to_dict() if isinstance(context, pd.Series) else context)
        sim_state["price_base"] = candidate_price

        # Update dependent channel features consistently
        online_p = float(sim_state.get("online_price", 0.0) or 0.0)
        if online_p > 0:
            sim_state["price_ratio_to_online"] = float(candidate_price / online_p)
            sim_state["has_online_listing"] = 1
        else:
            sim_state["price_ratio_to_online"] = 0.0

        # Update promotional discount if regular baseline price exists
        reg_price = float(sim_state.get("sale_price_before_promo", 0.0) or 0.0)
        if reg_price > 0 and candidate_price < reg_price:
            disc_amt = max(0.0, reg_price - candidate_price)
            sim_state["promo_discount_amount"] = disc_amt
            sim_state["promo_discount_pct"] = (disc_amt / reg_price) * 100.0
            sim_state["sale_price_time_promo"] = candidate_price
            sim_state["is_on_promo"] = 1

        df_sim = pd.DataFrame([sim_state])
        for c in self.demand_cat_cols:
            if c in df_sim.columns:
                df_sim[c] = df_sim[c].astype("category")

        for col in self.demand_features:
            if col not in df_sim.columns:
                df_sim[col] = 0.0

        X = df_sim[self.demand_features]
        q_pred = float(self.demand_booster.predict(X)[0])
        return max(0.0, q_pred)

    def simulate_multi_horizon_demand(
        self,
        context: Union[pd.Series, Dict[str, Any]],
        candidate_price: float,
        max_horizon: int = 30,
    ) -> Dict[str, Any]:
        """
        Simulates autoregressive multi-step demand rollout for 7d, 14d, 30d.
        """
        ctx = dict(context.to_dict() if isinstance(context, pd.Series) else context)
        origin_date = pd.to_datetime(ctx.get("date", "2024-08-04"))

        sim_state = dict(ctx)
        sim_state["price_base"] = candidate_price
        online_p = float(sim_state.get("online_price", 0.0) or 0.0)
        if online_p > 0:
            sim_state["price_ratio_to_online"] = float(candidate_price / online_p)

        recent_lags = [
            float(ctx.get("demand_lag_1", 0.0)),
            float(ctx.get("demand_lag_2", 0.0)),
            float(ctx.get("demand_lag_3", 0.0)),
            float(ctx.get("demand_lag_7", 0.0)),
            float(ctx.get("demand_lag_14", 0.0)),
            float(ctx.get("demand_lag_28", 0.0)),
        ]
        lag_history = [
            float(ctx.get("demand_lag_3", 0.0)),
            float(ctx.get("demand_lag_2", 0.0)),
            float(ctx.get("demand_lag_1", 0.0)),
        ]

        daily_preds: List[float] = []

        for step in range(1, max_horizon + 1):
            curr_date = origin_date + pd.Timedelta(days=step)
            sim_state["date"] = curr_date.strftime("%Y-%m-%d")
            sim_state["year"] = curr_date.year
            sim_state["month"] = curr_date.month
            sim_state["day_of_month"] = curr_date.day
            sim_state["day_of_week"] = curr_date.dayofweek
            sim_state["day_of_year"] = curr_date.dayofyear
            sim_state["week_of_year"] = curr_date.isocalendar().week
            sim_state["quarter"] = curr_date.quarter
            sim_state["is_weekend"] = 1 if curr_date.dayofweek in [5, 6] else 0
            sim_state["is_month_start"] = 1 if curr_date.is_month_start else 0
            sim_state["is_month_end"] = 1 if curr_date.is_month_end else 0
            sim_state["sin_month"] = np.sin(2 * np.pi * curr_date.month / 12)
            sim_state["cos_month"] = np.cos(2 * np.pi * curr_date.month / 12)
            sim_state["sin_day_of_week"] = np.sin(2 * np.pi * curr_date.dayofweek / 7)
            sim_state["cos_day_of_week"] = np.cos(2 * np.pi * curr_date.dayofweek / 7)

            sim_state["demand_lag_1"] = lag_history[-1]
            sim_state["demand_lag_2"] = lag_history[-2] if len(lag_history) >= 2 else lag_history[-1]
            sim_state["demand_lag_3"] = lag_history[-3] if len(lag_history) >= 3 else lag_history[-1]
            sim_state["demand_lag_7"] = lag_history[-7] if len(lag_history) >= 7 else recent_lags[3]
            sim_state["demand_lag_14"] = lag_history[-14] if len(lag_history) >= 14 else recent_lags[4]
            sim_state["demand_lag_28"] = lag_history[-28] if len(lag_history) >= 28 else recent_lags[5]

            window_7 = lag_history[-7:] if len(lag_history) >= 7 else lag_history
            window_28 = lag_history[-28:] if len(lag_history) >= 28 else lag_history
            sim_state["demand_roll_mean_7"] = float(np.mean(window_7))
            sim_state["demand_roll_std_7"] = float(np.std(window_7))
            sim_state["demand_roll_mean_28"] = float(np.mean(window_28))
            sim_state["demand_roll_std_28"] = float(np.std(window_28))

            row_df = pd.DataFrame([sim_state])
            for c in self.demand_cat_cols:
                if c in row_df.columns:
                    row_df[c] = row_df[c].astype("category")
            for col in self.demand_features:
                if col not in row_df.columns:
                    row_df[col] = 0.0

            q_step = float(self.demand_booster.predict(row_df[self.demand_features])[0])
            q_step = max(0.0, q_step)
            lag_history.append(q_step)
            daily_preds.append(q_step)

        d7_tot = sum(daily_preds[:7])
        d14_tot = sum(daily_preds[:14])
        d30_tot = sum(daily_preds[:30])

        return {
            "daily_predictions": daily_preds,
            "demand_7d": round(d7_tot, 2),
            "revenue_7d": round(candidate_price * d7_tot, 2),
            "demand_14d": round(d14_tot, 2),
            "revenue_14d": round(candidate_price * d14_tot, 2),
            "demand_30d": round(d30_tot, 2),
            "revenue_30d": round(candidate_price * d30_tot, 2),
        }

    def predict_candidates_demand_vectorized(
        self,
        context: Union[pd.Series, Dict[str, Any]],
        candidate_prices: List[float],
    ) -> List[float]:
        """
        Predicts daily demand for a list of candidate prices in a single vectorized call.
        """
        ctx_dict = context.to_dict() if isinstance(context, pd.Series) else dict(context)
        online_p = float(ctx_dict.get("online_price", 0.0) or 0.0)
        reg_price = float(ctx_dict.get("sale_price_before_promo", 0.0) or 0.0)

        rows = []
        for p in candidate_prices:
            sim_state = dict(ctx_dict)
            sim_state["price_base"] = p
            if online_p > 0:
                sim_state["price_ratio_to_online"] = float(p / online_p)
                sim_state["has_online_listing"] = 1
            else:
                sim_state["price_ratio_to_online"] = 0.0

            if reg_price > 0 and p < reg_price:
                disc_amt = max(0.0, reg_price - p)
                sim_state["promo_discount_amount"] = disc_amt
                sim_state["promo_discount_pct"] = (disc_amt / reg_price) * 100.0
                sim_state["sale_price_time_promo"] = p
                sim_state["is_on_promo"] = 1

            rows.append(sim_state)

        df_batch = pd.DataFrame(rows)
        for c in self.demand_cat_cols:
            if c in df_batch.columns:
                df_batch[c] = df_batch[c].astype("category")

        for col in self.demand_features:
            if col not in df_batch.columns:
                df_batch[col] = 0.0

        X = df_batch[self.demand_features]
        preds = self.demand_booster.predict(X)
        return [max(0.0, float(q)) for q in preds]

    def optimize_revenue_for_item(
        self,
        context: Union[pd.Series, Dict[str, Any]],
        min_multiplier: float = 0.80,
        max_multiplier: float = 1.20,
        step_pct: float = 0.02,
        custom_candidates: Optional[List[float]] = None,
        simulate_multi_horizon: bool = False,
    ) -> RevenueOptimizationResult:
        """
        Executes complete revenue optimization simulation for an item-store context.
        """
        ctx = context.to_dict() if isinstance(context, pd.Series) else dict(context)
        item_id = str(ctx.get("item_id", "UNKNOWN"))
        store_id = int(ctx.get("store_id", 1))
        date_str = str(ctx.get("date", "N/A"))
        dept_name = str(ctx.get("dept_name", "N/A"))
        class_name = str(ctx.get("class_name", "N/A"))

        # 1. Establish Reference Price
        ref_price, ref_source = self.establish_reference_price(ctx)

        # 2. Predict Clearing Price (M2 Step 4)
        pred_clearing_price = self.predict_clearing_price(ctx)

        # 3. Generate Candidates
        candidates = self.generate_candidate_prices(
            reference_price=ref_price,
            min_multiplier=min_multiplier,
            max_multiplier=max_multiplier,
            step_pct=step_pct,
            custom_candidates=custom_candidates,
        )

        # 4. Find Clearing Recommended Price (Minimum discrepancy to model clearing price)
        clearing_rec_price = min(candidates, key=lambda p: abs(p - pred_clearing_price))

        # 5. Predict Demand for All Candidates in Single Batch
        demands = self.predict_candidates_demand_vectorized(ctx, candidates)

        # Baseline Reference Demand & Revenue
        ref_idx = candidates.index(round(ref_price, 2)) if round(ref_price, 2) in candidates else -1
        ref_demand = demands[ref_idx] if ref_idx >= 0 else self.predict_daily_demand(ctx, ref_price)
        ref_revenue = round(ref_price * ref_demand, 2)

        # 6. Evaluate All Candidates
        evaluations: List[CandidateRevenueEvaluation] = []
        best_revenue = -1.0
        optimal_cand_price = candidates[0]

        for p_cand, q_cand in zip(candidates, demands):
            rev_cand = round(p_cand * q_cand, 2)
            pct_from_ref = round(((p_cand - ref_price) / ref_price) * 100.0, 2)

            # Arc Price Elasticity vs Reference Price
            implied_elasticity: Optional[float] = None
            if abs(p_cand - ref_price) > 1e-4 and ref_demand > 1e-4:
                pct_delta_q = (q_cand - ref_demand) / ref_demand
                pct_delta_p = (p_cand - ref_price) / ref_price
                implied_elasticity = round(pct_delta_q / pct_delta_p, 3)

            is_rec = (p_cand == clearing_rec_price)

            eval_item = CandidateRevenueEvaluation(
                candidate_price=p_cand,
                percentage_from_ref=pct_from_ref,
                predicted_daily_demand=round(q_cand, 3),
                expected_daily_revenue=rev_cand,
                implied_elasticity_vs_ref=implied_elasticity,
                revenue_lift_vs_ref_pct=round(((rev_cand - ref_revenue) / max(0.01, ref_revenue)) * 100.0, 2),
                demand_change_vs_ref_pct=round(((q_cand - ref_demand) / max(0.001, ref_demand)) * 100.0, 2),
                is_revenue_optimal=False,
                is_clearing_recommended=is_rec,
            )
            evaluations.append(eval_item)

            if rev_cand > best_revenue:
                best_revenue = rev_cand
                optimal_cand_price = p_cand

        # 7. Mark Revenue-Optimal Candidate
        for ev in evaluations:
            if ev.candidate_price == optimal_cand_price:
                ev.is_revenue_optimal = True

        # Multi-horizon simulation for key prices if requested
        if simulate_multi_horizon:
            for ev in evaluations:
                if ev.is_revenue_optimal or ev.is_clearing_recommended or ev.candidate_price == round(ref_price, 2):
                    sim_h = self.simulate_multi_horizon_demand(ctx, ev.candidate_price, max_horizon=30)
                    ev.predicted_7d_demand = sim_h["demand_7d"]
                    ev.expected_7d_revenue = sim_h["revenue_7d"]
                    ev.predicted_14d_demand = sim_h["demand_14d"]
                    ev.expected_14d_revenue = sim_h["revenue_14d"]
                    ev.predicted_30d_demand = sim_h["demand_30d"]
                    ev.expected_30d_revenue = sim_h["revenue_30d"]

        # 8. Clearing Price Metrics
        clearing_eval = next(ev for ev in evaluations if ev.candidate_price == clearing_rec_price)
        clearing_demand = clearing_eval.predicted_daily_demand
        clearing_revenue = clearing_eval.expected_daily_revenue

        # 9. Optimal Metrics
        optimal_eval = next(ev for ev in evaluations if ev.candidate_price == optimal_cand_price)
        optimal_demand = optimal_eval.predicted_daily_demand
        optimal_revenue = optimal_eval.expected_daily_revenue

        # Compute Lift vs Clearing Price for all candidates
        for ev in evaluations:
            ev.revenue_lift_vs_rec_pct = round(
                ((ev.expected_daily_revenue - clearing_revenue) / max(0.01, clearing_revenue)) * 100.0, 2
            )

        # 10. Summary comparisons
        opt_price_chg_ref = round(((optimal_cand_price - ref_price) / ref_price) * 100.0, 2)
        opt_price_chg_rec = round(((optimal_cand_price - clearing_rec_price) / clearing_rec_price) * 100.0, 2)
        opt_rev_lift_ref = round(((optimal_revenue - ref_revenue) / max(0.01, ref_revenue)) * 100.0, 2)
        opt_rev_lift_rec = round(((optimal_revenue - clearing_revenue) / max(0.01, clearing_revenue)) * 100.0, 2)
        opt_q_chg_ref = round(((optimal_demand - ref_demand) / max(0.001, ref_demand)) * 100.0, 2)
        opt_q_chg_rec = round(((optimal_demand - clearing_demand) / max(0.001, clearing_demand)) * 100.0, 2)

        # Rationale synthesis
        rationale = (
            f"Revenue-optimal price ${optimal_cand_price:.2f} ({opt_price_chg_ref:+.1f}% vs ref ${ref_price:.2f}) "
            f"yields ${optimal_revenue:.2f}/day (+{opt_rev_lift_ref:.1f}% rev lift) with demand {optimal_demand:.2f} units/day. "
            f"Compared to clearing-aligned price ${clearing_rec_price:.2f} (Rev: ${clearing_revenue:.2f}/day), "
            f"revenue optimization delivers {opt_rev_lift_rec:+.1f}% incremental revenue."
        )

        candidates_summary = [asdict(ev) for ev in evaluations]

        return RevenueOptimizationResult(
            item_id=item_id,
            store_id=store_id,
            date=date_str,
            dept_name=dept_name,
            class_name=class_name,
            reference_price=round(ref_price, 2),
            reference_source=ref_source,
            reference_expected_demand=round(ref_demand, 3),
            reference_expected_revenue=round(ref_revenue, 2),
            predicted_clearing_price=round(pred_clearing_price, 2),
            clearing_recommended_price=round(clearing_rec_price, 2),
            clearing_expected_demand=round(clearing_demand, 3),
            clearing_expected_revenue=round(clearing_revenue, 2),
            optimal_revenue_price=round(optimal_cand_price, 2),
            optimal_expected_demand=round(optimal_demand, 3),
            optimal_expected_revenue=round(optimal_revenue, 2),
            optimal_price_change_pct_from_ref=opt_price_chg_ref,
            optimal_price_change_pct_from_rec=opt_price_chg_rec,
            optimal_revenue_lift_pct_vs_ref=opt_rev_lift_ref,
            optimal_revenue_lift_pct_vs_rec=opt_rev_lift_rec,
            optimal_demand_change_pct_vs_ref=opt_q_chg_ref,
            optimal_demand_change_pct_vs_rec=opt_q_chg_rec,
            candidate_range=(min(candidates), max(candidates)),
            candidate_step_pct=step_pct,
            num_candidates_evaluated=len(candidates),
            optimization_rationale=rationale,
            candidates_evaluations=evaluations,
            candidates_summary=candidates_summary,
        )

    def optimize_batch(
        self,
        df_context: pd.DataFrame,
        min_multiplier: float = 0.80,
        max_multiplier: float = 1.20,
        step_pct: float = 0.02,
        simulate_multi_horizon: bool = False,
        progress_interval: int = 50,
    ) -> RevenueOptimizationBatchSummary:
        """
        Runs revenue optimization across multiple item-store observations.
        """
        results: List[RevenueOptimizationResult] = []
        n_total = len(df_context)
        log.info("Starting batch revenue optimization for %d observations...", n_total)
        t0 = time.time()

        for idx, (_, row) in enumerate(df_context.iterrows(), 1):
            res = self.optimize_revenue_for_item(
                context=row,
                min_multiplier=min_multiplier,
                max_multiplier=max_multiplier,
                step_pct=step_pct,
                simulate_multi_horizon=simulate_multi_horizon,
            )
            results.append(res)
            if idx % progress_interval == 0 or idx == n_total:
                log.info("  -> Processed %d/%d items (%.1fs elapsed)", idx, n_total, time.time() - t0)

        tot_rev_ref = sum(r.reference_expected_revenue for r in results)
        tot_rev_clearing = sum(r.clearing_expected_revenue for r in results)
        tot_rev_opt = sum(r.optimal_expected_revenue for r in results)

        tot_dem_ref = sum(r.reference_expected_demand for r in results)
        tot_dem_opt = sum(r.optimal_expected_demand for r in results)

        port_rev_lift_ref = ((tot_rev_opt - tot_rev_ref) / max(0.01, tot_rev_ref)) * 100.0
        port_rev_lift_clearing = ((tot_rev_opt - tot_rev_clearing) / max(0.01, tot_rev_clearing)) * 100.0
        port_dem_chg = ((tot_dem_opt - tot_dem_ref) / max(0.001, tot_dem_ref)) * 100.0

        return RevenueOptimizationBatchSummary(
            total_items_optimized=len(results),
            total_daily_expected_revenue_ref=round(tot_rev_ref, 2),
            total_daily_expected_revenue_clearing=round(tot_rev_clearing, 2),
            total_daily_expected_revenue_optimal=round(tot_rev_opt, 2),
            portfolio_revenue_lift_pct_vs_ref=round(port_rev_lift_ref, 2),
            portfolio_revenue_lift_pct_vs_clearing=round(port_rev_lift_clearing, 2),
            avg_reference_price=round(float(np.mean([r.reference_price for r in results])), 2),
            avg_clearing_recommended_price=round(float(np.mean([r.clearing_recommended_price for r in results])), 2),
            avg_optimal_revenue_price=round(float(np.mean([r.optimal_revenue_price for r in results])), 2),
            total_daily_demand_ref=round(tot_dem_ref, 2),
            total_daily_demand_optimal=round(tot_dem_opt, 2),
            portfolio_demand_change_pct=round(port_dem_chg, 2),
            results=results,
        )

    @staticmethod
    def to_dataframe(results: List[RevenueOptimizationResult]) -> pd.DataFrame:
        """Converts a list of RevenueOptimizationResult objects into a DataFrame."""
        records = []
        for r in results:
            records.append({
                "item_id": r.item_id,
                "store_id": r.store_id,
                "date": r.date,
                "dept_name": r.dept_name,
                "class_name": r.class_name,
                "reference_price": r.reference_price,
                "reference_source": r.reference_source,
                "reference_expected_demand": r.reference_expected_demand,
                "reference_expected_revenue": r.reference_expected_revenue,
                "predicted_clearing_price": r.predicted_clearing_price,
                "clearing_recommended_price": r.clearing_recommended_price,
                "clearing_expected_demand": r.clearing_expected_demand,
                "clearing_expected_revenue": r.clearing_expected_revenue,
                "optimal_revenue_price": r.optimal_revenue_price,
                "optimal_expected_demand": r.optimal_expected_demand,
                "optimal_expected_revenue": r.optimal_expected_revenue,
                "optimal_price_change_pct_from_ref": r.optimal_price_change_pct_from_ref,
                "optimal_price_change_pct_from_rec": r.optimal_price_change_pct_from_rec,
                "optimal_revenue_lift_pct_vs_ref": r.optimal_revenue_lift_pct_vs_ref,
                "optimal_revenue_lift_pct_vs_rec": r.optimal_revenue_lift_pct_vs_rec,
                "optimal_demand_change_pct_vs_ref": r.optimal_demand_change_pct_vs_ref,
                "optimal_demand_change_pct_vs_rec": r.optimal_demand_change_pct_vs_rec,
                "num_candidates_evaluated": r.num_candidates_evaluated,
                "optimization_rationale": r.optimization_rationale,
            })
        return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# CLI Runner and Artifact Generator
# ---------------------------------------------------------------------------
def run_and_save_sample_optimizations(n_samples: int = 100) -> None:
    """Runs revenue optimization on a diverse test sample and saves artifacts."""
    log.info("Loading test dataset from: %s", DEFAULT_TEST_DATA_PATH)
    test_df = pd.read_csv(DEFAULT_TEST_DATA_PATH, nrows=5000)

    # Sample unique item-store rows
    sample_df = test_df.drop_duplicates(subset=["item_id", "store_id"]).head(n_samples)

    engine = RevenueOptimizationEngine()

    log.info("Running optimization on %d sample items...", len(sample_df))
    batch_summary = engine.optimize_batch(sample_df, simulate_multi_horizon=True, progress_interval=20)

    # Save summary DataFrame
    df_results = engine.to_dataframe(batch_summary.results)
    csv_path = REPORTS_DIR / "revenue_optimization_examples.csv"
    df_results.to_csv(csv_path, index=False)
    log.info("Saved CSV sample results to: %s (%d rows)", csv_path, len(df_results))

    # Save detailed JSON with candidate curve details
    json_path = REPORTS_DIR / "revenue_optimization_examples.json"
    json_data = {
        "summary": {
            "total_items_optimized": batch_summary.total_items_optimized,
            "total_daily_expected_revenue_ref": batch_summary.total_daily_expected_revenue_ref,
            "total_daily_expected_revenue_clearing": batch_summary.total_daily_expected_revenue_clearing,
            "total_daily_expected_revenue_optimal": batch_summary.total_daily_expected_revenue_optimal,
            "portfolio_revenue_lift_pct_vs_ref": batch_summary.portfolio_revenue_lift_pct_vs_ref,
            "portfolio_revenue_lift_pct_vs_clearing": batch_summary.portfolio_revenue_lift_pct_vs_clearing,
            "avg_reference_price": batch_summary.avg_reference_price,
            "avg_clearing_recommended_price": batch_summary.avg_clearing_recommended_price,
            "avg_optimal_revenue_price": batch_summary.avg_optimal_revenue_price,
            "total_daily_demand_ref": batch_summary.total_daily_demand_ref,
            "total_daily_demand_optimal": batch_summary.total_daily_demand_optimal,
            "portfolio_demand_change_pct": batch_summary.portfolio_demand_change_pct,
        },
        "sample_cases": [asdict(r) for r in batch_summary.results[:10]],
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)
    log.info("Saved JSON sample cases to: %s", json_path)

    # Save serialized engine metadata
    meta_path = REVENUE_DIR / "revenue_engine_meta.joblib"
    engine_meta = {
        "engine_version": "1.0.0",
        "milestone": 3,
        "step": 1,
        "demand_model_path": str(DEFAULT_DEMAND_MODEL_PATH),
        "price_model_path": str(DEFAULT_PRICE_MODEL_PATH),
        "demand_features": engine.demand_features,
        "price_features": engine.price_features,
        "optimization_objective": "Expected Revenue = candidate_price * predicted_demand",
        "guardrails": {"default_min_multiplier": 0.80, "default_max_multiplier": 1.20, "default_step_pct": 0.02},
    }
    joblib.dump(engine_meta, meta_path)
    log.info("Saved revenue engine metadata to: %s", meta_path)


if __name__ == "__main__":
    run_and_save_sample_optimizations()
