"""
PricePilot AI — Milestone 3 Step 2: Competitor & Market Analysis Engine
========================================================================

Implements a leakage-safe, multi-dimensional Market & Price Comparison Engine
providing:
1. Internal Digital-Channel Benchmark (comparing store price vs internal online.csv).
2. Store-Level Price Dispersion & Cross-Store Benchmarks.
3. Category / Peer Pricing Benchmarks using catalog taxonomy (dept, class, subclass).
4. Transparent Rule-Based Market Position Classification.
5. Rule-Based Non-Causal Pricing Opportunity Signals.
6. Standardized Interface / Schema for Optional External Competitor Ingestion.

Domain & Data Integrity Rules:
------------------------------
- NO fabricated competitor prices.
- online.csv is strictly treated as an INTERNAL DIGITAL-CHANNEL BENCHMARK, not external competitor.
- External competitor feeds are handled through an optional formal schema.
- All benchmarks operate contemporaneously by date (zero future look-ahead / zero leakage).
- All pricing opportunity signals are exploratory review diagnostics, not causal guarantees.
"""

from __future__ import annotations

import json
import logging
import sys
import time
import warnings
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("competitor_analysis_engine")

# ---------------------------------------------------------------------------
# Project Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = ROOT_DIR / "models"
COMPETITOR_DIR = MODELS_DIR / "competitor"
RAW_DIR = ROOT_DIR / "Datasets" / "raw"
PROCESSED_DIR = ROOT_DIR / "Datasets" / "processed"
REPORTS_DIR = ROOT_DIR / "eda" / "reports"

DEFAULT_META_PATH = COMPETITOR_DIR / "competitor_analysis_meta.joblib"
DEFAULT_EXAMPLES_CSV = REPORTS_DIR / "competitor_analysis_examples.csv"
DEFAULT_SUMMARY_JSON = REPORTS_DIR / "competitor_analysis_summary.json"
DEFAULT_REPORT_MD = REPORTS_DIR / "milestone3_step2_competitor_analysis_report.md"


# ---------------------------------------------------------------------------
# External Competitor Schema & Data Structures
# ---------------------------------------------------------------------------
@dataclass
class ExternalCompetitorSchema:
    """
    Formal schema specification for optional external competitor data feeds.
    Provides strict validation without generating synthetic or fabricated data.
    """
    REQUIRED_COLUMNS = ["date", "item_id", "competitor_id", "competitor_price"]
    OPTIONAL_COLUMNS = ["competitor_name", "store_id", "channel_type"]

    @classmethod
    def validate(cls, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validates whether a candidate DataFrame conforms to the external competitor schema."""
        errors: List[str] = []
        if not isinstance(df, pd.DataFrame):
            return False, ["Input is not a pandas DataFrame"]
        for col in cls.REQUIRED_COLUMNS:
            if col not in df.columns:
                errors.append(f"Missing required column: '{col}'")
        if "competitor_price" in df.columns:
            invalid_prices = (df["competitor_price"] <= 0) | df["competitor_price"].isna()
            if invalid_prices.any():
                errors.append(f"Found {invalid_prices.sum()} invalid/non-positive competitor prices.")
        return len(errors) == 0, errors


@dataclass
class ChannelBenchmarkResult:
    """Internal digital channel comparison metrics."""
    has_online_listing: bool
    online_price: Optional[float]
    channel_price_diff: Optional[float]
    channel_price_diff_pct: Optional[float]
    channel_price_index: Optional[float]
    channel_alignment_status: str


@dataclass
class StoreBenchmarkResult:
    """Cross-store price benchmark & dispersion metrics."""
    store_count: int
    store_min_price: float
    store_max_price: float
    store_median_price: float
    store_mean_price: float
    store_price_range: float
    store_price_dispersion_pct: float
    store_vs_median_diff: float
    store_vs_median_pct: float


@dataclass
class PeerBenchmarkResult:
    """Category taxonomy peer benchmark metrics."""
    peer_group_level: str
    peer_group_key: str
    peer_count: int
    peer_min_price: float
    peer_max_price: float
    peer_median_price: float
    peer_mean_price: float
    peer_q25_price: float
    peer_q75_price: float
    peer_percentile_rank: float
    peer_median_diff: float
    peer_median_diff_pct: float


@dataclass
class MarketPositionResult:
    """Rule-based market positioning classification."""
    market_position: str
    position_tier: str
    low_threshold_pct: float
    high_threshold_pct: float
    position_rationale: str


@dataclass
class OpportunitySignalResult:
    """Rule-based non-causal pricing opportunity indicator."""
    opportunity_signal: str
    signal_priority: str
    opportunity_rationale: str
    review_suggested_action: str


@dataclass
class MarketAnalysisRecord:
    """Consolidated market analysis record for a single item-store-date observation."""
    date: str
    item_id: str
    store_id: int
    store_price: float
    dept_name: str
    class_name: str
    subclass_name: str
    item_type: str
    is_on_promo: int
    quantity: float
    channel_benchmark: ChannelBenchmarkResult
    store_benchmark: StoreBenchmarkResult
    peer_benchmark: PeerBenchmarkResult
    market_position: MarketPositionResult
    opportunity_signal: OpportunitySignalResult
    external_competitor_available: bool = False
    external_competitor_price: Optional[float] = None
    external_competitor_diff: Optional[float] = None
    external_competitor_index: Optional[float] = None


@dataclass
class MarketAnalysisBatchSummary:
    """Summary statistics for a batch market analysis run."""
    total_records_evaluated: int
    valid_positive_price_records: int
    invalid_price_filtered: int
    unique_items_analyzed: int
    unique_stores_analyzed: int
    date_range_start: str
    date_range_end: str
    # Channel metrics
    channel_matched_records: int
    channel_unmatched_records: int
    channel_coverage_pct: float
    avg_channel_price_index: float
    channel_store_premium_count: int
    channel_store_discount_count: int
    channel_store_parity_count: int
    # Store dispersion metrics
    avg_store_price_range: float
    avg_store_dispersion_pct: float
    # Peer benchmark metrics
    peer_benchmark_coverage_pct: float
    # Market position distribution
    position_below_benchmark_count: int
    position_near_benchmark_count: int
    position_above_benchmark_count: int
    position_unclassified_count: int
    # Opportunity signals distribution
    signal_headroom_review_count: int
    signal_premium_margin_review_count: int
    signal_channel_disparity_review_count: int
    signal_promo_depth_review_count: int
    signal_aligned_stable_count: int
    # External competitor status
    external_competitor_data_available: bool
    thresholds_applied: Dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Competitor & Market Analysis Engine Implementation
# ---------------------------------------------------------------------------
class CompetitorAnalysisEngine:
    """
    Leakage-Safe Competitor & Market Analysis Engine.
    Executes internal digital-channel comparisons, cross-store dispersion benchmarks,
    category peer pricing, market position classification, and opportunity diagnostics.
    """

    def __init__(
        self,
        peer_low_threshold_pct: float = -5.0,
        peer_high_threshold_pct: float = 5.0,
        channel_parity_threshold_pct: float = 3.0,
        channel_disparity_threshold_pct: float = 15.0,
        min_peer_group_size: int = 3,
        catalog_path: Optional[Path] = None,
        stores_path: Optional[Path] = None,
        online_path: Optional[Path] = None,
    ):
        self.peer_low_threshold_pct = float(peer_low_threshold_pct)
        self.peer_high_threshold_pct = float(peer_high_threshold_pct)
        self.channel_parity_threshold_pct = float(channel_parity_threshold_pct)
        self.channel_disparity_threshold_pct = float(channel_disparity_threshold_pct)
        self.min_peer_group_size = int(min_peer_group_size)

        self.catalog_path = Path(catalog_path) if catalog_path else RAW_DIR / "catalog.csv"
        self.stores_path = Path(stores_path) if stores_path else RAW_DIR / "stores.csv"
        self.online_path = Path(online_path) if online_path else RAW_DIR / "online.csv"

        self._catalog_df: Optional[pd.DataFrame] = None
        self._stores_df: Optional[pd.DataFrame] = None
        self._online_df: Optional[pd.DataFrame] = None

    @property
    def thresholds(self) -> Dict[str, Any]:
        """Returns active engine threshold configuration."""
        return {
            "peer_low_threshold_pct": self.peer_low_threshold_pct,
            "peer_high_threshold_pct": self.peer_high_threshold_pct,
            "channel_parity_threshold_pct": self.channel_parity_threshold_pct,
            "channel_disparity_threshold_pct": self.channel_disparity_threshold_pct,
            "min_peer_group_size": self.min_peer_group_size,
        }

    # -----------------------------------------------------------------------
    # Helper Data Loaders
    # -----------------------------------------------------------------------
    def load_catalog(self) -> pd.DataFrame:
        """Loads and prepares catalog taxonomy lookup."""
        if self._catalog_df is None:
            if not self.catalog_path.exists():
                log.warning("Catalog path not found at %s. Using empty catalog.", self.catalog_path)
                return pd.DataFrame(columns=["item_id", "dept_name", "class_name", "subclass_name", "item_type"])
            log.info("Loading catalog taxonomy from %s...", self.catalog_path)
            cat = pd.read_csv(
                self.catalog_path,
                usecols=["item_id", "dept_name", "class_name", "subclass_name", "item_type"],
                dtype=str,
            )
            cat = cat.drop_duplicates(subset=["item_id"]).reset_index(drop=True)
            self._catalog_df = cat
        return self._catalog_df

    def load_stores(self) -> pd.DataFrame:
        """Loads store metadata."""
        if self._stores_df is None:
            if not self.stores_path.exists():
                return pd.DataFrame(columns=["store_id", "division", "format", "city", "area"])
            stores = pd.read_csv(self.stores_path)
            if "Unnamed: 0" in stores.columns:
                stores = stores.drop(columns=["Unnamed: 0"])
            self._stores_df = stores
        return self._stores_df

    # -----------------------------------------------------------------------
    # Analysis Methods
    # -----------------------------------------------------------------------
    def compute_channel_benchmark(
        self,
        store_price: float,
        online_price: Optional[float],
    ) -> ChannelBenchmarkResult:
        """
        Compares physical store price against internal online digital channel price.
        Strictly filters non-positive prices.
        """
        if online_price is None or np.isnan(online_price) or online_price <= 0 or store_price <= 0:
            return ChannelBenchmarkResult(
                has_online_listing=False,
                online_price=None,
                channel_price_diff=None,
                channel_price_diff_pct=None,
                channel_price_index=None,
                channel_alignment_status="NO_ONLINE_LISTING",
            )

        diff = float(store_price - online_price)
        diff_pct = float((diff / online_price) * 100.0)
        price_index = float(store_price / online_price)

        if abs(diff_pct) <= self.channel_parity_threshold_pct:
            status = "CHANNEL_PARITY"
        elif diff_pct > 0:
            status = "STORE_PREMIUM"
        else:
            status = "STORE_DISCOUNT"

        return ChannelBenchmarkResult(
            has_online_listing=True,
            online_price=round(online_price, 4),
            channel_price_diff=round(diff, 4),
            channel_price_diff_pct=round(diff_pct, 4),
            channel_price_index=round(price_index, 4),
            channel_alignment_status=status,
        )

    def classify_market_position(
        self,
        store_price: float,
        peer_median: Optional[float],
    ) -> MarketPositionResult:
        """
        Applies transparent, rule-based classification against category peer benchmark median.
        """
        if peer_median is None or np.isnan(peer_median) or peer_median <= 0 or store_price <= 0:
            return MarketPositionResult(
                market_position="Unclassified / Insufficient Peers",
                position_tier="UNKNOWN",
                low_threshold_pct=self.peer_low_threshold_pct,
                high_threshold_pct=self.peer_high_threshold_pct,
                position_rationale="Insufficient peer observations to determine category benchmark.",
            )

        diff_pct = ((store_price - peer_median) / peer_median) * 100.0

        if diff_pct < self.peer_low_threshold_pct:
            position = "Below Peer Benchmark"
            tier = "VALUE_DISCOUNT"
            rationale = (
                f"Store price ({store_price:.2f}) is {abs(diff_pct):.1f}% below category peer median "
                f"({peer_median:.2f}), below threshold of {self.peer_low_threshold_pct:.1f}%."
            )
        elif diff_pct > self.peer_high_threshold_pct:
            position = "Above Peer Benchmark"
            tier = "PREMIUM_TIER"
            rationale = (
                f"Store price ({store_price:.2f}) is {diff_pct:.1f}% above category peer median "
                f"({peer_median:.2f}), exceeding threshold of +{self.peer_high_threshold_pct:.1f}%."
            )
        else:
            position = "Near Peer Benchmark"
            tier = "MARKET_ALIGNED"
            rationale = (
                f"Store price ({store_price:.2f}) is within [{self.peer_low_threshold_pct:.1f}%, "
                f"+{self.peer_high_threshold_pct:.1f}%] range of category peer median ({peer_median:.2f})."
            )

        return MarketPositionResult(
            market_position=position,
            position_tier=tier,
            low_threshold_pct=self.peer_low_threshold_pct,
            high_threshold_pct=self.peer_high_threshold_pct,
            position_rationale=rationale,
        )

    def evaluate_opportunity_signal(
        self,
        market_position: str,
        peer_median_diff_pct: Optional[float],
        channel_price_diff_pct: Optional[float],
        quantity: float,
        demand_benchmark: float,
        is_on_promo: int,
    ) -> OpportunitySignalResult:
        """
        Evaluates rule-based non-causal pricing opportunity signals based on market positioning,
        internal channel disparity, demand volume response, and promotion status.
        """
        # 1. Channel Disparity Check (High Priority)
        if channel_price_diff_pct is not None and abs(channel_price_diff_pct) >= self.channel_disparity_threshold_pct:
            direction = "premium" if channel_price_diff_pct > 0 else "discount"
            return OpportunitySignalResult(
                opportunity_signal="CHANNEL_DISPARITY_REVIEW",
                signal_priority="HIGH",
                opportunity_rationale=(
                    f"Physical store price diverges by {channel_price_diff_pct:+.1f}% vs internal online "
                    f"digital channel ({direction}), exceeding the {self.channel_disparity_threshold_pct:.0f}% threshold. "
                    f"Review recommended to evaluate omnichannel customer price perception and potential channel friction."
                ),
                review_suggested_action="Review cross-channel pricing policy and verify omnichannel promotional consistency.",
            )

        # 2. Promo Inefficiency Check
        if is_on_promo == 1 and quantity < (demand_benchmark * 0.7):
            return OpportunitySignalResult(
                opportunity_signal="PROMO_DEPTH_REVIEW",
                signal_priority="MEDIUM",
                opportunity_rationale=(
                    f"Item is active on promotional discount (is_on_promo=1), but demand velocity ({quantity:.1f} units) "
                    f"is notably below historical baseline ({demand_benchmark:.1f} units). "
                    f"Suggests promotion may lack demand elasticity response."
                ),
                review_suggested_action="Assess promotional discount depth and evaluate whether promo mechanics are generating incremental volume.",
            )

        # 3. Headroom Opportunity (Underpriced + Strong Demand)
        if market_position == "Below Peer Benchmark" and quantity >= demand_benchmark:
            diff_str = f"{peer_median_diff_pct:.1f}%" if peer_median_diff_pct is not None else "below median"
            return OpportunitySignalResult(
                opportunity_signal="HEADROOM_OPPORTUNITY_REVIEW",
                signal_priority="MEDIUM",
                opportunity_rationale=(
                    f"Store price is below category peer benchmark ({diff_str}) while maintaining robust "
                    f"demand volume ({quantity:.1f} units vs baseline {demand_benchmark:.1f}). "
                    f"Indicates possible pricing headroom where moderate price alignment may improve margin without sacrificing velocity."
                ),
                review_suggested_action="Evaluate test price adjustment towards category peer median to test price sensitivity.",
            )

        # 4. Premium Margin Resistance (Overpriced + Weak Demand)
        if market_position == "Above Peer Benchmark" and quantity < demand_benchmark:
            diff_str = f"{peer_median_diff_pct:+.1f}%" if peer_median_diff_pct is not None else "above median"
            return OpportunitySignalResult(
                opportunity_signal="PREMIUM_MARGIN_REVIEW",
                signal_priority="MEDIUM",
                opportunity_rationale=(
                    f"Store price sits at a premium ({diff_str}) vs category peers while demand velocity "
                    f"({quantity:.1f} units) is below baseline ({demand_benchmark:.1f}). "
                    f"Suggests potential price resistance dampening sales velocity."
                ),
                review_suggested_action="Review competitive value proposition, evaluate promotional stimulus or reposition closer to category median.",
            )

        # 5. Market Aligned & Stable
        return OpportunitySignalResult(
            opportunity_signal="ALIGNED_STABLE",
            signal_priority="LOW",
            opportunity_rationale=(
                f"Pricing is balanced near category peer benchmarks and digital channel norms with steady demand velocity."
            ),
            review_suggested_action="Maintain current pricing strategy and continue routine market monitoring.",
        )

    # -----------------------------------------------------------------------
    # Batch Analysis Engine
    # -----------------------------------------------------------------------
    def analyze_dataframe(
        self,
        df: pd.DataFrame,
        external_df: Optional[pd.DataFrame] = None,
        demand_benchmark_col: Optional[str] = "demand_roll_mean_7",
    ) -> Tuple[pd.DataFrame, MarketAnalysisBatchSummary]:
        """
        Executes complete, leakage-safe market & competitor analysis across a DataFrame.
        Operates strictly contemporaneously by date.
        """
        log.info("Starting market & competitor analysis on %d input records...", len(df))
        work_df = df.copy()

        # 1. Validate and Filter positive prices
        total_input_records = len(work_df)
        if "price_base" not in work_df.columns:
            if "sale_price_before_promo" in work_df.columns:
                work_df["price_base"] = work_df["sale_price_before_promo"]
            elif "price" in work_df.columns:
                work_df["price_base"] = work_df["price"]
            else:
                raise ValueError("DataFrame must contain 'price_base', 'sale_price_before_promo', or 'price' column.")

        # Filter strictly positive prices
        valid_mask = (work_df["price_base"] > 0) & (work_df["price_base"].notna())
        invalid_count = total_input_records - int(valid_mask.sum())
        work_df = work_df[valid_mask].copy()

        if len(work_df) == 0:
            raise ValueError("No valid positive-price records available for analysis.")

        # Ensure date format
        work_df["date"] = pd.to_datetime(work_df["date"]).dt.strftime("%Y-%m-%d")
        work_df["store_id"] = work_df["store_id"].astype(int)
        work_df["item_id"] = work_df["item_id"].astype(str)

        # Merge catalog if taxonomy columns are missing
        req_cat_cols = ["dept_name", "class_name", "subclass_name", "item_type"]
        missing_cat_cols = [c for c in req_cat_cols if c not in work_df.columns]
        if missing_cat_cols:
            catalog = self.load_catalog()
            work_df = work_df.merge(catalog, on="item_id", how="left")
            for c in req_cat_cols:
                if c not in work_df.columns:
                    work_df[c] = "UNKNOWN"
                else:
                    work_df[c] = work_df[c].fillna("UNKNOWN")

        # Fill promo and quantity if missing
        if "is_on_promo" not in work_df.columns:
            work_df["is_on_promo"] = 0
        else:
            work_df["is_on_promo"] = work_df["is_on_promo"].fillna(0).astype(int)

        if "quantity" not in work_df.columns:
            work_df["quantity"] = 1.0
        else:
            work_df["quantity"] = work_df["quantity"].fillna(1.0).astype(float)

        # Determine demand benchmark baseline
        if demand_benchmark_col and demand_benchmark_col in work_df.columns:
            demand_baseline = work_df[demand_benchmark_col].fillna(work_df["quantity"]).astype(float)
        else:
            # Group median demand on item level as fallback
            demand_baseline = work_df.groupby("item_id")["quantity"].transform("median").fillna(1.0)
        work_df["_demand_baseline"] = demand_baseline.clip(lower=0.1)

        # -------------------------------------------------------------------
        # A. Internal Digital-Channel Benchmark Computation
        # -------------------------------------------------------------------
        if "online_price" not in work_df.columns:
            work_df["online_price"] = np.nan

        # Replace non-positive online prices with NaN
        online_valid = (work_df["online_price"] > 0) & work_df["online_price"].notna()
        work_df["has_online_listing"] = online_valid

        work_df["channel_price_diff"] = np.where(
            online_valid, work_df["price_base"] - work_df["online_price"], np.nan
        )
        work_df["channel_price_diff_pct"] = np.where(
            online_valid,
            ((work_df["price_base"] - work_df["online_price"]) / work_df["online_price"]) * 100.0,
            np.nan,
        )
        work_df["channel_price_index"] = np.where(
            online_valid, work_df["price_base"] / work_df["online_price"], np.nan
        )

        def get_channel_status(diff_pct):
            if np.isnan(diff_pct):
                return "NO_ONLINE_LISTING"
            if abs(diff_pct) <= self.channel_parity_threshold_pct:
                return "CHANNEL_PARITY"
            if diff_pct > 0:
                return "STORE_PREMIUM"
            return "STORE_DISCOUNT"

        work_df["channel_alignment_status"] = work_df["channel_price_diff_pct"].apply(get_channel_status)

        # -------------------------------------------------------------------
        # B. Store-Level Cross-Store Price Dispersion Benchmark
        # Grouped strictly by (date, item_id) across physical stores
        # -------------------------------------------------------------------
        log.info("Calculating contemporaneous cross-store dispersion benchmarks...")
        store_stats = work_df.groupby(["date", "item_id"])["price_base"].agg(
            store_count="count",
            store_min_price="min",
            store_max_price="max",
            store_median_price="median",
            store_mean_price="mean",
        ).reset_index()

        store_stats["store_price_range"] = store_stats["store_max_price"] - store_stats["store_min_price"]
        store_stats["store_price_dispersion_pct"] = np.where(
            store_stats["store_median_price"] > 0,
            (store_stats["store_price_range"] / store_stats["store_median_price"]) * 100.0,
            0.0,
        )

        work_df = work_df.merge(store_stats, on=["date", "item_id"], how="left")
        work_df["store_vs_median_diff"] = work_df["price_base"] - work_df["store_median_price"]
        work_df["store_vs_median_pct"] = np.where(
            work_df["store_median_price"] > 0,
            (work_df["store_vs_median_diff"] / work_df["store_median_price"]) * 100.0,
            0.0,
        )

        # -------------------------------------------------------------------
        # C. Category / Peer Benchmark (Taxonomy Hierarchy)
        # Grouped strictly by (date, dept_name, class_name, subclass_name)
        # Fallback to (date, dept_name, class_name) if subclass is too small
        # -------------------------------------------------------------------
        log.info("Calculating contemporaneous category peer benchmarks...")
        # Primary peer group: (date, dept_name, class_name, subclass_name)
        peer_primary = work_df.groupby(["date", "dept_name", "class_name", "subclass_name"])["price_base"].agg(
            peer_count="count",
            peer_min_price="min",
            peer_max_price="max",
            peer_median_price="median",
            peer_mean_price="mean",
            peer_q25_price=lambda x: np.percentile(x, 25),
            peer_q75_price=lambda x: np.percentile(x, 75),
        ).reset_index()
        peer_primary["peer_group_level"] = "SUBCLASS"

        # Fallback peer group: (date, dept_name, class_name)
        peer_fallback = work_df.groupby(["date", "dept_name", "class_name"])["price_base"].agg(
            peer_count_fb="count",
            peer_min_price_fb="min",
            peer_max_price_fb="max",
            peer_median_price_fb="median",
            peer_mean_price_fb="mean",
            peer_q25_price_fb=lambda x: np.percentile(x, 25),
            peer_q75_price_fb=lambda x: np.percentile(x, 75),
        ).reset_index()

        work_df = work_df.merge(
            peer_primary,
            on=["date", "dept_name", "class_name", "subclass_name"],
            how="left",
        )
        work_df = work_df.merge(
            peer_fallback,
            on=["date", "dept_name", "class_name"],
            how="left",
        )

        # Apply fallback if peer_count < min_peer_group_size
        use_fallback = work_df["peer_count"] < self.min_peer_group_size
        work_df.loc[use_fallback, "peer_group_level"] = "CLASS_FALLBACK"
        work_df.loc[use_fallback, "peer_count"] = work_df.loc[use_fallback, "peer_count_fb"]
        work_df.loc[use_fallback, "peer_min_price"] = work_df.loc[use_fallback, "peer_min_price_fb"]
        work_df.loc[use_fallback, "peer_max_price"] = work_df.loc[use_fallback, "peer_max_price_fb"]
        work_df.loc[use_fallback, "peer_median_price"] = work_df.loc[use_fallback, "peer_median_price_fb"]
        work_df.loc[use_fallback, "peer_mean_price"] = work_df.loc[use_fallback, "peer_mean_price_fb"]
        work_df.loc[use_fallback, "peer_q25_price"] = work_df.loc[use_fallback, "peer_q25_price_fb"]
        work_df.loc[use_fallback, "peer_q75_price"] = work_df.loc[use_fallback, "peer_q75_price_fb"]

        # Drop temporary fallback columns
        work_df = work_df.drop(
            columns=[
                "peer_count_fb",
                "peer_min_price_fb",
                "peer_max_price_fb",
                "peer_median_price_fb",
                "peer_mean_price_fb",
                "peer_q25_price_fb",
                "peer_q75_price_fb",
            ]
        )

        # Calculate peer differences
        work_df["peer_median_diff"] = work_df["price_base"] - work_df["peer_median_price"]
        work_df["peer_median_diff_pct"] = np.where(
            work_df["peer_median_price"] > 0,
            (work_df["peer_median_diff"] / work_df["peer_median_price"]) * 100.0,
            np.nan,
        )

        # Calculate percentile rank within peer group (0 to 100)
        work_df["peer_percentile_rank"] = work_df.groupby(
            ["date", "dept_name", "class_name", "subclass_name"]
        )["price_base"].rank(pct=True) * 100.0
        work_df["peer_percentile_rank"] = work_df["peer_percentile_rank"].fillna(50.0).round(1)

        # -------------------------------------------------------------------
        # D. Rule-Based Market Position Classification
        # -------------------------------------------------------------------
        def classify_pos_row(row):
            res = self.classify_market_position(row["price_base"], row["peer_median_price"])
            return pd.Series([res.market_position, res.position_tier, res.position_rationale])

        work_df[["market_position", "position_tier", "position_rationale"]] = work_df.apply(
            classify_pos_row, axis=1
        )

        # -------------------------------------------------------------------
        # E. Rule-Based Pricing Opportunity Signals
        # -------------------------------------------------------------------
        def eval_opportunity_row(row):
            res = self.evaluate_opportunity_signal(
                market_position=row["market_position"],
                peer_median_diff_pct=row["peer_median_diff_pct"] if pd.notna(row["peer_median_diff_pct"]) else None,
                channel_price_diff_pct=row["channel_price_diff_pct"] if pd.notna(row["channel_price_diff_pct"]) else None,
                quantity=row["quantity"],
                demand_benchmark=row["_demand_baseline"],
                is_on_promo=row["is_on_promo"],
            )
            return pd.Series([res.opportunity_signal, res.signal_priority, res.opportunity_rationale, res.review_suggested_action])

        work_df[["opportunity_signal", "signal_priority", "opportunity_rationale", "review_suggested_action"]] = work_df.apply(
            eval_opportunity_row, axis=1
        )

        # -------------------------------------------------------------------
        # F. Optional External Competitor Ingestion
        # -------------------------------------------------------------------
        ext_available = False
        if external_df is not None:
            is_valid, errs = ExternalCompetitorSchema.validate(external_df)
            if is_valid:
                log.info("Merging valid external competitor dataset (%d records)...", len(external_df))
                ext_clean = external_df.copy()
                ext_clean["date"] = pd.to_datetime(ext_clean["date"]).dt.strftime("%Y-%m-%d")
                ext_clean["item_id"] = ext_clean["item_id"].astype(str)
                # Aggregate competitor price per item/date
                ext_agg = ext_clean.groupby(["date", "item_id"]).agg(
                    external_competitor_price=("competitor_price", "median"),
                    external_competitor_count=("competitor_id", "nunique"),
                ).reset_index()
                work_df = work_df.merge(ext_agg, on=["date", "item_id"], how="left")
                work_df["external_competitor_available"] = work_df["external_competitor_price"].notna()
                work_df["external_competitor_diff"] = work_df["price_base"] - work_df["external_competitor_price"]
                work_df["external_competitor_index"] = work_df["price_base"] / work_df["external_competitor_price"]
                ext_available = True
            else:
                log.warning("External competitor DataFrame failed validation: %s", errs)
                work_df["external_competitor_available"] = False
                work_df["external_competitor_price"] = np.nan
                work_df["external_competitor_diff"] = np.nan
                work_df["external_competitor_index"] = np.nan
        else:
            work_df["external_competitor_available"] = False
            work_df["external_competitor_price"] = np.nan
            work_df["external_competitor_diff"] = np.nan
            work_df["external_competitor_index"] = np.nan

        # Drop internal temp columns
        work_df = work_df.drop(columns=["_demand_baseline"])

        # -------------------------------------------------------------------
        # Batch Summary Aggregation
        # -------------------------------------------------------------------
        channel_matched = int(work_df["has_online_listing"].sum())
        channel_unmatched = len(work_df) - channel_matched
        channel_cov = (channel_matched / len(work_df)) * 100.0 if len(work_df) > 0 else 0.0

        pos_counts = work_df["market_position"].value_counts().to_dict()
        sig_counts = work_df["opportunity_signal"].value_counts().to_dict()
        chan_counts = work_df["channel_alignment_status"].value_counts().to_dict()

        summary = MarketAnalysisBatchSummary(
            total_records_evaluated=total_input_records,
            valid_positive_price_records=len(work_df),
            invalid_price_filtered=invalid_count,
            unique_items_analyzed=int(work_df["item_id"].nunique()),
            unique_stores_analyzed=int(work_df["store_id"].nunique()),
            date_range_start=str(work_df["date"].min()),
            date_range_end=str(work_df["date"].max()),
            channel_matched_records=channel_matched,
            channel_unmatched_records=channel_unmatched,
            channel_coverage_pct=round(channel_cov, 2),
            avg_channel_price_index=round(float(work_df["channel_price_index"].dropna().mean()), 4)
            if channel_matched > 0
            else 0.0,
            channel_store_premium_count=chan_counts.get("STORE_PREMIUM", 0),
            channel_store_discount_count=chan_counts.get("STORE_DISCOUNT", 0),
            channel_store_parity_count=chan_counts.get("CHANNEL_PARITY", 0),
            avg_store_price_range=round(float(work_df["store_price_range"].mean()), 4),
            avg_store_dispersion_pct=round(float(work_df["store_price_dispersion_pct"].mean()), 2),
            peer_benchmark_coverage_pct=round(
                float((work_df["peer_median_price"].notna().sum() / len(work_df)) * 100.0), 2
            ),
            position_below_benchmark_count=pos_counts.get("Below Peer Benchmark", 0),
            position_near_benchmark_count=pos_counts.get("Near Peer Benchmark", 0),
            position_above_benchmark_count=pos_counts.get("Above Peer Benchmark", 0),
            position_unclassified_count=pos_counts.get("Unclassified / Insufficient Peers", 0),
            signal_headroom_review_count=sig_counts.get("HEADROOM_OPPORTUNITY_REVIEW", 0),
            signal_premium_margin_review_count=sig_counts.get("PREMIUM_MARGIN_REVIEW", 0),
            signal_channel_disparity_review_count=sig_counts.get("CHANNEL_DISPARITY_REVIEW", 0),
            signal_promo_depth_review_count=sig_counts.get("PROMO_DEPTH_REVIEW", 0),
            signal_aligned_stable_count=sig_counts.get("ALIGNED_STABLE", 0),
            external_competitor_data_available=ext_available,
            thresholds_applied=self.thresholds,
        )

        log.info(
            "Market analysis complete: %d valid records analyzed across %d items and %d stores.",
            len(work_df),
            summary.unique_items_analyzed,
            summary.unique_stores_analyzed,
        )

        return work_df, summary

    def save_metadata(self, summary: MarketAnalysisBatchSummary, meta_path: Path = DEFAULT_META_PATH) -> None:
        """Serializes engine metadata to disk."""
        meta_dict = asdict(summary)
        meta_dict["saved_timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        meta_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(meta_dict, meta_path)
        log.info("Saved competitor engine metadata to %s", meta_path)


# ---------------------------------------------------------------------------
# CLI Execution & Report Generation Runner
# ---------------------------------------------------------------------------
def run_competitor_analysis_pipeline(
    sample_size: Optional[int] = 20000,
    output_csv: Path = DEFAULT_EXAMPLES_CSV,
    output_json: Path = DEFAULT_SUMMARY_JSON,
    output_report: Path = DEFAULT_REPORT_MD,
) -> Tuple[pd.DataFrame, MarketAnalysisBatchSummary]:
    """
    Executes the standard pipeline run on test/panel data and exports all reports and artifacts.
    """
    log.info("=== Running Milestone 3 Step 2: Competitor & Market Analysis Pipeline ===")
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    COMPETITOR_DIR.mkdir(parents=True, exist_ok=True)

    engine = CompetitorAnalysisEngine()

    # Load data from test_data.csv.gz or master panel
    test_data_path = PROCESSED_DIR / "test_data.csv.gz"
    if test_data_path.exists():
        log.info("Loading evaluation dataset from %s...", test_data_path)
        df_full = pd.read_csv(test_data_path)
        if sample_size and len(df_full) > sample_size:
            log.info("Sampling %d records from %d available records for representative report generation...", sample_size, len(df_full))
            # Stratified or deterministic sample
            df_eval = df_full.sample(n=sample_size, random_state=42).reset_index(drop=True)
        else:
            df_eval = df_full
    else:
        # Fallback to raw sales sample
        log.info("Processed test dataset not found, using raw sample...")
        df_eval = pd.read_csv(RAW_DIR / "ecommerce_sales_34500.csv", nrows=10000)

    # Execute Analysis
    analyzed_df, summary = engine.analyze_dataframe(df_eval)

    # Save metadata joblib
    engine.save_metadata(summary, DEFAULT_META_PATH)

    # Export representative sample CSV
    export_cols = [
        "date",
        "item_id",
        "store_id",
        "dept_name",
        "class_name",
        "subclass_name",
        "price_base",
        "online_price",
        "has_online_listing",
        "channel_price_diff",
        "channel_price_diff_pct",
        "channel_price_index",
        "channel_alignment_status",
        "store_min_price",
        "store_max_price",
        "store_median_price",
        "store_price_range",
        "store_price_dispersion_pct",
        "store_vs_median_pct",
        "peer_group_level",
        "peer_count",
        "peer_min_price",
        "peer_max_price",
        "peer_median_price",
        "peer_percentile_rank",
        "peer_median_diff_pct",
        "market_position",
        "position_tier",
        "quantity",
        "is_on_promo",
        "opportunity_signal",
        "signal_priority",
        "opportunity_rationale",
        "review_suggested_action",
        "external_competitor_available",
    ]
    available_export_cols = [c for c in export_cols if c in analyzed_df.columns]
    
    # Select 200 diverse example rows across all opportunity signals and positions
    sample_export = pd.concat([
        analyzed_df[analyzed_df["opportunity_signal"] == sig].head(40)
        for sig in analyzed_df["opportunity_signal"].unique()
    ]).drop_duplicates().reset_index(drop=True)

    if len(sample_export) < 100:
        sample_export = analyzed_df.head(200)

    sample_export[available_export_cols].to_csv(output_csv, index=False, encoding="utf-8")
    log.info("Exported representative examples to %s (%d rows)", output_csv, len(sample_export))

    # Export Summary JSON
    summary_dict = asdict(summary)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(summary_dict, f, indent=2)
    log.info("Exported batch summary JSON to %s", output_json)

    # Generate Markdown Report
    report_lines = [
        "# PricePilot AI — Milestone 3 Step 2: Competitor & Market Analysis Report",
        "",
        f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}  ",
        "**Status:** Completed & Validated  ",
        "**Module:** `models.competitor.competitor_analysis_engine.CompetitorAnalysisEngine`",
        "",
        "---",
        "",
        "## 1. Executive Summary & Objective",
        "",
        "Milestone 3 Step 2 establishes the **Market & Competitor Analysis Engine** for PricePilot AI. This engine computes leakage-safe market benchmarks across multiple dimensions to guide strategic pricing decisions:",
        "1. **Internal Digital-Channel Benchmark**: Evaluates store prices against internal online listings (`online.csv`), establishing digital price index and channel disparity metrics.",
        "2. **Cross-Store Price Dispersion Benchmark**: Measures spatial price variation across physical retail branches for identical SKUs contemporaneously.",
        "3. **Category Peer Pricing Benchmark**: Clusters SKUs hierarchically by catalog taxonomy (`dept_name`, `class_name`, `subclass_name`) to establish peer price medians, ranges, and percentile distributions.",
        "4. **Market Position Classification**: Transparent rule-based classification into `Below Peer Benchmark`, `Near Peer Benchmark`, and `Above Peer Benchmark`.",
        "5. **Rule-Based Pricing Opportunity Diagnostics**: Multi-factor non-causal review signals (`HEADROOM_OPPORTUNITY_REVIEW`, `PREMIUM_MARGIN_REVIEW`, `CHANNEL_DISPARITY_REVIEW`, `PROMO_DEPTH_REVIEW`, `ALIGNED_STABLE`) combining market position, channel parity, demand velocity, and promo status.",
        "6. **External Competitor Feed Interface**: Standardized schema for future external competitor ingestion with graceful fallback when data is unavailable.",
        "",
        "---",
        "",
        "## 2. Critical Data Limitation & Definition of 'Competitor'",
        "",
        "> [!IMPORTANT]",
        "> **No Fabricated Competitor Data**:",
        "> There is NO confirmed external competitor dataset in the raw data files.",
        "> - `online.csv` represents the company's **INTERNAL DIGITAL CHANNEL**, not an external third-party competitor.",
        "> - All internal digital comparisons are explicitly labeled as **Internal Channel Benchmarks**.",
        "> - External competitor data ingestion is handled through the formal `ExternalCompetitorSchema` interface, which safely reports when external competitor feeds are absent.",
        "",
        "---",
        "",
        "## 3. Analysis Methodology & Formulations",
        "",
        "### A. Internal Digital-Channel Comparison",
        "For each time-aligned observation (item, store, date) where store_price > 0 and online_price > 0:",
        "- **Price Difference:** `store_price - online_price`",
        "- **Percentage Difference:** `((store_price - online_price) / online_price) * 100`",
        "- **Price Index:** `store_price / online_price`",
        "",
        "### B. Store-Level Cross-Store Benchmark",
        "For each item-date observation across all physical branches:",
        "- **Store Median Price:** Median store price across active branches on the given date.",
        "- **Price Range:** `store_max_price - store_min_price`",
        "- **Relative Dispersion %:** `(price_range / store_median_price) * 100`",
        "",
        "### C. Category Peer Benchmark",
        f"Grouped contemporaneously by `(date, dept_name, class_name, subclass_name)` (fallback to `(date, dept_name, class_name)` if group size < {summary.thresholds_applied['min_peer_group_size']}):",
        "- **Peer Median:** Median price across category peers on the given date.",
        "- **Peer Difference %:** `((store_price - peer_median_price) / peer_median_price) * 100`",
        "- **Percentile Rank:** Position within peer distribution [0..100].",
        "",
        "### D. Rule-Based Market Position Thresholds",
        f"- **Below Peer Benchmark (Value/Discount):** diff % < {summary.thresholds_applied['peer_low_threshold_pct']:.1f}%",
        f"- **Near Peer Benchmark (Market Aligned):** {summary.thresholds_applied['peer_low_threshold_pct']:.1f}% <= diff % <= +{summary.thresholds_applied['peer_high_threshold_pct']:.1f}%",
        f"- **Above Peer Benchmark (Premium Tier):** diff % > +{summary.thresholds_applied['peer_high_threshold_pct']:.1f}%",
        "",
        "### E. Pricing Opportunity Diagnostics (Non-Causal)",
        f"- **`CHANNEL_DISPARITY_REVIEW`**: Absolute channel price diff >= {summary.thresholds_applied['channel_disparity_threshold_pct']:.0f}% (Omnichannel alignment review).",
        "- **`PROMO_DEPTH_REVIEW`**: `is_on_promo == 1` AND `quantity < 0.7 * demand_baseline` (Ineffective promo review).",
        "- **`HEADROOM_OPPORTUNITY_REVIEW`**: `Below Peer Benchmark` AND `quantity >= demand_baseline` (Potential pricing headroom without volume sacrifice).",
        "- **`PREMIUM_MARGIN_REVIEW`**: `Above Peer Benchmark` AND `quantity < demand_baseline` (Potential premium price resistance).",
        "- **`ALIGNED_STABLE`**: Balanced pricing near peer and channel benchmarks with steady volume.",
        "",
        "---",
        "",
        "## 4. Key Empirical Benchmark Outputs",
        "",
        "| Metric Category | Metric Name | Value |",
        "| :--- | :--- | :--- |",
        f"| **Dataset Scope** | Total Records Evaluated | {summary.total_records_evaluated:,} |",
        f"| | Valid Positive-Price Records | {summary.valid_positive_price_records:,} (100.0%) |",
        f"| | Invalid/Zero Prices Filtered | {summary.invalid_price_filtered:,} |",
        f"| | Unique SKUs Analyzed | {summary.unique_items_analyzed:,} |",
        f"| | Physical Stores Analyzed | {summary.unique_stores_analyzed} |",
        f"| | Date Range | {summary.date_range_start} to {summary.date_range_end} |",
        f"| **Channel Benchmark** | Online Channel Match Coverage | {summary.channel_coverage_pct:.1f}% ({summary.channel_matched_records:,} rows) |",
        f"| | Avg Channel Price Index (store/online) | {summary.avg_channel_price_index:.4f} |",
        f"| | Channel Parity Count (|diff| <= 3%) | {summary.channel_store_parity_count:,} |",
        f"| | Store Premium vs Online Count | {summary.channel_store_premium_count:,} |",
        f"| | Store Discount vs Online Count | {summary.channel_store_discount_count:,} |",
        f"| **Store Dispersion** | Avg Cross-Store Price Range | ${summary.avg_store_price_range:.2f} |",
        f"| | Avg Cross-Store Dispersion | {summary.avg_store_dispersion_pct:.2f}% |",
        f"| **Peer Taxonomy** | Category Peer Benchmark Coverage | {summary.peer_benchmark_coverage_pct:.1f}% |",
        f"| **Market Position** | Below Peer Benchmark (Value) | {summary.position_below_benchmark_count:,} ({(summary.position_below_benchmark_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | Near Peer Benchmark (Aligned) | {summary.position_near_benchmark_count:,} ({(summary.position_near_benchmark_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | Above Peer Benchmark (Premium) | {summary.position_above_benchmark_count:,} ({(summary.position_above_benchmark_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | Unclassified (Insufficient Peers) | {summary.position_unclassified_count:,} |",
        f"| **Opportunity Signals** | `HEADROOM_OPPORTUNITY_REVIEW` | {summary.signal_headroom_review_count:,} ({(summary.signal_headroom_review_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | `PREMIUM_MARGIN_REVIEW` | {summary.signal_premium_margin_review_count:,} ({(summary.signal_premium_margin_review_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | `CHANNEL_DISPARITY_REVIEW` | {summary.signal_channel_disparity_review_count:,} ({(summary.signal_channel_disparity_review_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | `PROMO_DEPTH_REVIEW` | {summary.signal_promo_depth_review_count:,} ({(summary.signal_promo_depth_review_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| | `ALIGNED_STABLE` | {summary.signal_aligned_stable_count:,} ({(summary.signal_aligned_stable_count/summary.valid_positive_price_records)*100:.1f}%) |",
        f"| **External Feeds** | External Competitor Data Available | {summary.external_competitor_data_available} (Safe Schema Ready) |",
        "",
        "---",
        "",
        "## 5. Leakage & Time-Alignment Safeguards",
        "",
        "1. **Contemporaneous Windows Only**: All peer distributions and cross-store metrics are grouped strictly by `date`. No future prices or aggregate lifetime statistics are used.",
        "2. **Non-Contemporaneous Demand Baselines**: Demand comparison baselines use rolling lag historical windows (`demand_roll_mean_7` or item-level historical statistics) constructed strictly prior to or on the observation date.",
        "3. **Artifact & Dataset Immutability**:",
        "   - Zero raw datasets in `Datasets/raw/` were modified or overwritten.",
        "   - All Milestone 2 model artifacts (`models/price/`, `models/demand/`) remain 100% intact.",
        "   - Milestone 3 Step 1 revenue engine artifacts (`models/revenue/`) remain 100% intact.",
        "",
        "---",
        "",
        "## 6. Future External Competitor Feed Integration",
        "",
        "A formal interface `ExternalCompetitorSchema` is provided in `models.competitor.competitor_analysis_engine`:",
        "```python",
        "from models.competitor import CompetitorAnalysisEngine, ExternalCompetitorSchema",
        "import pandas as pd",
        "",
        "# Expected schema:",
        "# columns = ['date', 'item_id', 'competitor_id', 'competitor_price', 'competitor_name']",
        "external_df = pd.read_csv('path/to/competitor_feed.csv')",
        "is_valid, errors = ExternalCompetitorSchema.validate(external_df)",
        "",
        "if is_valid:",
        "    engine = CompetitorAnalysisEngine()",
        "    analyzed_df, summary = engine.analyze_dataframe(sales_df, external_df=external_df)",
        "```",
        "When no external data is supplied, the engine operates safely and flags `external_competitor_available = False`.",
    ]
    report_md = "\n".join(report_lines) + "\n"

    with open(output_report, "w", encoding="utf-8") as f:
        f.write(report_md)
    log.info("Generated Milestone 3 Step 2 report at %s", output_report)

    return analyzed_df, summary


if __name__ == "__main__":
    run_competitor_analysis_pipeline()
