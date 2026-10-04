"""
Model Registry for PricePilot AI.
Loads elasticity_model.pkl and dataset1_electronics_training_snapshot.csv ONCE at startup.
Exposes recommend_price(), forecast_price(), and build_kpi_record() as thin wrappers
around pricing_logic.py functions.
"""

import os
import sys
import pickle
import inspect
import numbers
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

# Safe patsy unpickling patch for Python 3.14+ call stack handling
try:
    import patsy.eval
    orig_capture = patsy.eval.EvalEnvironment.capture

    @classmethod
    def _safe_capture(cls, eval_env=0, reference=0):
        if isinstance(eval_env, cls):
            return eval_env
        elif isinstance(eval_env, numbers.Integral):
            depth = eval_env + reference
        else:
            return orig_capture(eval_env, reference)
        frame = inspect.currentframe()
        last_valid_frame = frame
        try:
            for _ in range(depth + 1):
                if frame is None:
                    break
                last_valid_frame = frame
                frame = frame.f_back
            target = frame if frame is not None else last_valid_frame
            flags = target.f_code.co_flags & getattr(patsy.eval, "_ALL_FUTURE_FLAGS", 0)
            return cls([target.f_locals, target.f_globals], flags)
        finally:
            del frame
            del last_valid_frame

    patsy.eval.EvalEnvironment.capture = _safe_capture
except Exception as e:
    logging.warning(f"Could not patch patsy EvalEnvironment.capture: {e}")

# Import validated pricing logic functions as-is
from model_exports.pricing_logic import (
    recommend_price_elasticity_based,
    forecast_price_trend,
    classify_trend,
    compute_confidence_score_ols,
    build_full_kpi_record,
)

logger = logging.getLogger(__name__)


class ModelRegistry:
    def __init__(self):
        self.elasticity_model = None
        self.df1_elec = None
        self.df1_elec_trimmed = None
        self.elasticity_coef: float = -71.673
        self.model_r_squared: float = 0.328
        self.p_value: float = 0.0001
        self.initialized = False

    def load(self):
        if self.initialized:
            return

        base_dir = Path(__file__).resolve().parent.parent.parent
        model_path = base_dir / "model_exports" / "elasticity_model.pkl"
        csv_path = base_dir / "model_exports" / "dataset1_electronics_training_snapshot.csv"

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not csv_path.exists():
            raise FileNotFoundError(f"Dataset snapshot not found: {csv_path}")

        # Load elasticity model exactly as provided with pickle.load()
        with open(model_path, "rb") as f:
            self.elasticity_model = pickle.load(f)

        # Pull runtime parameters dynamically from the model object
        self.elasticity_coef = float(self.elasticity_model.params["price_gap_pct"])
        self.model_r_squared = float(self.elasticity_model.rsquared)
        if "price_gap_pct" in self.elasticity_model.pvalues:
            self.p_value = float(self.elasticity_model.pvalues["price_gap_pct"])

        # Load dataset snapshot once into memory
        self.df1_elec = pd.read_csv(csv_path)
        self.df1_elec["month_year"] = pd.to_datetime(self.df1_elec["month_year"])
        self.df1_elec_trimmed = self.df1_elec[self.df1_elec["month_year"] <= "2018-06-30"].copy()

        self.initialized = True
        logger.info(
            f"[ModelRegistry] Loaded elasticity model: beta={self.elasticity_coef:.3f}, "
            f"R2={self.model_r_squared:.3f}, p={self.p_value:.5f}, "
            f"training rows={len(self.df1_elec)}"
        )

    def recommend_price(
        self,
        current_price: float,
        competitor_price: float,
        baseline_qty: float,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        n_candidates: int = 50,
    ) -> Dict[str, Any]:
        """
        Thin wrapper around recommend_price_elasticity_based using runtime coefficient.
        """
        if not self.initialized:
            self.load()

        return recommend_price_elasticity_based(
            current_price=current_price,
            competitor_price=competitor_price,
            baseline_qty=baseline_qty,
            price_gap_coef=self.elasticity_coef,
            price_min=price_min,
            price_max=price_max,
            n_candidates=n_candidates,
        )

    def forecast_price(self, product_id: str, periods_ahead: int = 3) -> Optional[Dict[str, Any]]:
        """
        Thin wrapper around forecast_price_trend using in-memory training snapshot.
        """
        if not self.initialized:
            self.load()

        return forecast_price_trend(self.df1_elec, product_id, periods_ahead=periods_ahead)

    def classify_demand_trend(self, product_id: str) -> str:
        """
        Classifies demand trend using trimmed dataset.
        """
        if not self.initialized:
            self.load()

        trimmed = self.df1_elec_trimmed[self.df1_elec_trimmed["product_id"] == product_id]
        if len(trimmed) == 0:
            return "Stable Demand"
        return classify_trend(trimmed["qty"].tail(3).mean(), trimmed["qty"].mean())

    def compute_product_confidence(self, product_id: str, current_price: float, competitor_price: float) -> float:
        """
        Computes confidence score grounded in OLS model's actual R2 and prediction std error.
        """
        if not self.initialized:
            self.load()

        try:
            current_gap = (current_price - competitor_price) / competitor_price if competitor_price else 0.0
            # If product_id in training set, evaluate prediction
            if product_id in self.df1_elec["product_id"].values:
                eval_id = product_id
            else:
                eval_id = self.df1_elec["product_id"].iloc[0]

            pred_summary = self.elasticity_model.get_prediction(
                pd.DataFrame({"price_gap_pct": [current_gap], "product_id": [eval_id]})
            ).summary_frame()
            predicted_qty = max(pred_summary["mean"].iloc[0], 1e-6)
            relative_std_err = pred_summary["mean_se"].iloc[0] / predicted_qty
            conf = compute_confidence_score_ols(self.elasticity_model, relative_std_err, self.model_r_squared)
            return float(conf)
        except Exception as e:
            logger.warning(f"Error computing OLS confidence for {product_id}: {e}")
            return round(float(self.model_r_squared * 100), 1)

    def build_kpi_record(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Thin wrapper around build_full_kpi_record.
        """
        if not self.initialized:
            self.load()

        if product_id not in self.df1_elec["product_id"].values:
            return None

        record = build_full_kpi_record(
            self.elasticity_model, self.df1_elec, self.df1_elec_trimmed, product_id
        )
        # Ensure confidence_score is native float
        if record and "confidence_score" in record:
            record["confidence_score"] = float(record["confidence_score"])
        return record

    def get_metadata(self) -> Dict[str, Any]:
        if not self.initialized:
            self.load()
        return {
            "model_name": "Fixed-Effects OLS Regression (Dataset 1)",
            "elasticity_coefficient": self.elasticity_coef,
            "r_squared": self.model_r_squared,
            "p_value": self.p_value,
            "formula": "qty ~ price_gap_pct + C(product_id)",
            "training_samples": len(self.df1_elec),
            "skus": list(self.df1_elec["product_id"].unique()),
        }


# Global singleton instance loaded once at startup
registry = ModelRegistry()
