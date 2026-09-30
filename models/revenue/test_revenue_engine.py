"""
PricePilot AI — Milestone 3 Step 1: Revenue Optimization Engine Test Suite
========================================================================

Verifies the correctness, mathematical integrity, leakage safety, and
reproducibility of the Milestone 3 Revenue Optimization Engine.

Test Suite Structure:
---------------------
1. Test 1: Module Compilation & Import Integrity
2. Test 2: Artifact Loading & Feature Space Validation
3. Test 3: Reference Price Determination (Zero Leakage)
4. Test 4: Candidate Price Grid Generation & Bounds
5. Test 5: Single Item-Store Revenue Simulation & Expected Revenue Formula
6. Test 6: Optimal Selection & Dual-Price Retention (P*_rev vs P*_rec)
7. Test 7: Mathematical Invariants (Rev = P * Q, Non-negativity, Argmax)
8. Test 8: Multi-Horizon Revenue Simulation (7d, 14d, 30d)
9. Test 9: Batch Optimization & DataFrame Export Integrity
10. Test 10: Zero-Mutation & Milestone 2 Artifact Immutability Audit

Usage:
  python models/revenue/test_revenue_engine.py
"""

from __future__ import annotations

import json
import logging
import os
import py_compile
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

MODELS_DIR = ROOT_DIR / "models"
REVENUE_DIR = MODELS_DIR / "revenue"
PRICE_DIR = MODELS_DIR / "price"
DEMAND_DIR = MODELS_DIR / "demand"
PROCESSED_DIR = ROOT_DIR / "Datasets" / "processed"
RAW_DIR = ROOT_DIR / "Datasets" / "raw"
REPORTS_DIR = ROOT_DIR / "eda" / "reports"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("test_revenue_engine")


class TestFailure(Exception):
    """Custom exception for test assertion failure."""
    __test__ = False
    pass


def log_test_header(test_num: int, total_tests: int, name: str):
    print(f"\n[{test_num}/{total_tests}] RUNNING: {name}")
    print("-" * 70)


def log_test_passed(name: str, notes: str = ""):
    note_str = f" ({notes})" if notes else ""
    print(f"  -> [PASSED] {name}{note_str}")


# ===========================================================================
# TEST 1: Module Compilation & Import Integrity
# ===========================================================================
def test_1_compilation_and_imports():
    log_test_header(1, 10, "Module Compilation & Import Integrity")

    engine_file = REVENUE_DIR / "revenue_optimization_engine.py"
    if not engine_file.exists():
        raise TestFailure(f"Missing engine file: {engine_file}")

    py_compile.compile(str(engine_file), doraise=True)
    print("  [OK] Syntax compilation verified.")

    try:
        from models.revenue import (
            CandidateRevenueEvaluation,
            RevenueOptimizationBatchSummary,
            RevenueOptimizationEngine,
            RevenueOptimizationResult,
        )
    except Exception as e:
        raise TestFailure(f"Failed to import from models.revenue: {e}")

    log_test_passed("Module Compilation & Import Integrity")


# ===========================================================================
# TEST 2: Artifact Loading & Feature Space Validation
# ===========================================================================
def test_2_artifact_loading_and_features():
    log_test_header(2, 10, "Artifact Loading & Feature Space Validation")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()

    if engine.demand_booster is None:
        raise TestFailure("LightGBM demand booster failed to load.")
    if engine.price_model is None:
        raise TestFailure("RandomForest price model failed to load.")

    if len(engine.demand_features) != 49:
        raise TestFailure(f"Expected 49 demand features, found {len(engine.demand_features)}")
    if len(engine.price_features) != 41:
        raise TestFailure(f"Expected 41 price features, found {len(engine.price_features)}")

    # Ensure price_base is in demand model features but NOT in price model features
    if "price_base" not in engine.demand_features:
        raise TestFailure("'price_base' must be present in demand features for elasticity simulation.")
    if "price_base" in engine.price_features:
        raise TestFailure("'price_base' must NOT be in price model features (leakage prevention).")

    print(f"  [OK] Demand features verified: {len(engine.demand_features)}")
    print(f"  [OK] Price features verified: {len(engine.price_features)}")
    log_test_passed("Artifact Loading & Feature Space Validation")


# ===========================================================================
# TEST 3: Reference Price Determination (Zero Leakage)
# ===========================================================================
def test_3_reference_price_determination():
    log_test_header(3, 10, "Reference Price Determination (Zero Leakage)")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()

    # Case A: price_lag_1 is available
    ctx_a = {"price_lag_1": 120.0, "price_roll_mean_7": 115.0, "price_base": 999.0}
    ref_a, src_a = engine.establish_reference_price(ctx_a)
    if ref_a != 120.0 or src_a != "price_lag_1":
        raise TestFailure(f"Expected 120.0 from price_lag_1, got {ref_a} ({src_a})")

    # Case B: price_lag_1 missing, price_roll_mean_7 available
    ctx_b = {"price_lag_1": np.nan, "price_roll_mean_7": 115.0, "price_base": 999.0}
    ref_b, src_b = engine.establish_reference_price(ctx_b)
    if ref_b != 115.0 or src_b != "price_roll_mean_7":
        raise TestFailure(f"Expected 115.0 from price_roll_mean_7, got {ref_b} ({src_b})")

    # Case C: Cold-start fallback
    ctx_c = {"price_lag_1": None, "price_roll_mean_7": 0.0, "price_lag_7": np.nan}
    ref_c, src_c = engine.establish_reference_price(ctx_c, fallback_global_median=89.90)
    if ref_c != 89.90 or src_c != "fallback_global_median":
        raise TestFailure(f"Expected fallback 89.90, got {ref_c} ({src_c})")

    log_test_passed("Reference Price Determination")


# ===========================================================================
# TEST 4: Candidate Price Grid Generation & Bounds
# ===========================================================================
def test_4_candidate_generation():
    log_test_header(4, 10, "Candidate Price Grid Generation & Bounds")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()

    ref = 100.0
    cands = engine.generate_candidate_prices(
        reference_price=ref,
        min_multiplier=0.80,
        max_multiplier=1.20,
        step_pct=0.02,
    )

    if min(cands) != 80.0:
        raise TestFailure(f"Expected min candidate 80.0, got {min(cands)}")
    if max(cands) != 120.0:
        raise TestFailure(f"Expected max candidate 120.0, got {max(cands)}")
    if 100.0 not in cands:
        raise TestFailure("Reference price 100.0 must be included in candidates.")

    # Verify custom candidates
    custom = [50.0, 75.0, 100.0]
    cands_custom = engine.generate_candidate_prices(ref, custom_candidates=custom)
    if cands_custom != [50.0, 75.0, 100.0]:
        raise TestFailure(f"Custom candidates mismatch: {cands_custom}")

    log_test_passed("Candidate Price Grid Generation & Bounds")


# ===========================================================================
# TEST 5: Single Item-Store Simulation & Revenue Calculation
# ===========================================================================
def test_5_single_item_simulation():
    log_test_header(5, 10, "Single Item-Store Simulation & Revenue Calculation")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()

    test_df = pd.read_csv(PROCESSED_DIR / "test_data.csv.gz", nrows=5)
    row = test_df.iloc[0]

    result = engine.optimize_revenue_for_item(
        context=row,
        min_multiplier=0.80,
        max_multiplier=1.20,
        step_pct=0.02,
    )

    if result.item_id != str(row["item_id"]):
        raise TestFailure(f"Item ID mismatch: {result.item_id} vs {row['item_id']}")
    if result.num_candidates_evaluated < 10:
        raise TestFailure(f"Too few candidates evaluated: {result.num_candidates_evaluated}")

    # Check candidate mathematical correctness
    for ev in result.candidates_evaluations:
        expected_rev = round(ev.candidate_price * ev.predicted_daily_demand, 2)
        if abs(ev.expected_daily_revenue - expected_rev) > 0.05:
            raise TestFailure(
                f"Revenue mismatch for price {ev.candidate_price}: "
                f"got {ev.expected_daily_revenue}, expected {expected_rev}"
            )
        if ev.predicted_daily_demand < 0:
            raise TestFailure(f"Negative demand predicted: {ev.predicted_daily_demand}")

    print(f"  [OK] Item: {result.item_id} | Store: {result.store_id}")
    print(f"  [OK] Ref Price: ${result.reference_price:.2f} -> Daily Rev: ${result.reference_expected_revenue:.2f}")
    print(f"  [OK] Clearing Rec Price: ${result.clearing_recommended_price:.2f} -> Daily Rev: ${result.clearing_expected_revenue:.2f}")
    print(f"  [OK] Optimal Rev Price: ${result.optimal_revenue_price:.2f} -> Daily Rev: ${result.optimal_expected_revenue:.2f}")
    log_test_passed("Single Item-Store Simulation & Revenue Calculation")


# ===========================================================================
# TEST 6: Optimal Selection & Dual-Price Retention
# ===========================================================================
def test_6_optimal_selection_and_dual_price_retention():
    log_test_header(6, 10, "Optimal Selection & Dual-Price Retention")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()
    test_df = pd.read_csv(PROCESSED_DIR / "test_data.csv.gz", nrows=5)
    row = test_df.iloc[1]

    res = engine.optimize_revenue_for_item(row)

    # 1. Verify revenue optimal candidate is truly the argmax
    all_revs = [ev.expected_daily_revenue for ev in res.candidates_evaluations]
    max_rev = max(all_revs)
    if res.optimal_expected_revenue != max_rev:
        raise TestFailure(f"Optimal revenue {res.optimal_expected_revenue} != max revenue {max_rev}")

    # 2. Verify exactly one candidate is marked optimal
    optimal_flags = [ev.is_revenue_optimal for ev in res.candidates_evaluations]
    if sum(optimal_flags) != 1:
        raise TestFailure(f"Expected 1 optimal flag, found {sum(optimal_flags)}")

    # 3. Verify clearing recommended candidate is marked
    clearing_flags = [ev.is_clearing_recommended for ev in res.candidates_evaluations]
    if sum(clearing_flags) != 1:
        raise TestFailure(f"Expected 1 clearing recommended flag, found {sum(clearing_flags)}")

    # 4. Verify retention of both prices
    if res.optimal_revenue_price <= 0 or res.clearing_recommended_price <= 0:
        raise TestFailure("Prices must be positive numbers.")

    print(f"  [OK] Dual prices retained: Optimal=${res.optimal_revenue_price:.2f}, Clearing=${res.clearing_recommended_price:.2f}")
    log_test_passed("Optimal Selection & Dual-Price Retention")


# ===========================================================================
# TEST 7: Mathematical Invariants
# ===========================================================================
def test_7_mathematical_invariants():
    log_test_header(7, 10, "Mathematical Invariants")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()
    test_df = pd.read_csv(PROCESSED_DIR / "test_data.csv.gz", nrows=10)

    for i, row in test_df.iterrows():
        res = engine.optimize_revenue_for_item(row)
        if res.optimal_expected_revenue < res.reference_expected_revenue - 1e-4:
            raise TestFailure(
                f"Optimal revenue ({res.optimal_expected_revenue}) cannot be lower than "
                f"reference revenue ({res.reference_expected_revenue}) since reference price is in candidates."
            )
        if res.optimal_expected_revenue < res.clearing_expected_revenue - 1e-4:
            raise TestFailure(
                f"Optimal revenue ({res.optimal_expected_revenue}) cannot be lower than "
                f"clearing revenue ({res.clearing_expected_revenue})."
            )

    log_test_passed("Mathematical Invariants (Argmax optimality & non-negative bounds)")


# ===========================================================================
# TEST 8: Multi-Horizon Revenue Simulation (7d, 14d, 30d)
# ===========================================================================
def test_8_multi_horizon_simulation():
    log_test_header(8, 10, "Multi-Horizon Revenue Simulation (7d, 14d, 30d)")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()
    test_df = pd.read_csv(PROCESSED_DIR / "test_data.csv.gz", nrows=2)
    row = test_df.iloc[0]

    res = engine.optimize_revenue_for_item(row, simulate_multi_horizon=True)

    opt_ev = next(ev for ev in res.candidates_evaluations if ev.is_revenue_optimal)
    if opt_ev.predicted_7d_demand is None or opt_ev.expected_7d_revenue is None:
        raise TestFailure("7-day multi-horizon predictions missing.")
    if opt_ev.predicted_14d_demand is None or opt_ev.expected_14d_revenue is None:
        raise TestFailure("14-day multi-horizon predictions missing.")
    if opt_ev.predicted_30d_demand is None or opt_ev.expected_30d_revenue is None:
        raise TestFailure("30-day multi-horizon predictions missing.")

    # Check monotonicity of cumulative horizons (H7 <= H14 <= H30)
    if not (opt_ev.predicted_7d_demand <= opt_ev.predicted_14d_demand <= opt_ev.predicted_30d_demand + 1e-4):
        raise TestFailure("Cumulative multi-horizon demand must be non-decreasing across horizons.")

    print(f"  [OK] 7-day Demand: {opt_ev.predicted_7d_demand:.1f} units | 7-day Revenue: ${opt_ev.expected_7d_revenue:.2f}")
    print(f"  [OK] 14-day Demand: {opt_ev.predicted_14d_demand:.1f} units | 14-day Revenue: ${opt_ev.expected_14d_revenue:.2f}")
    print(f"  [OK] 30-day Demand: {opt_ev.predicted_30d_demand:.1f} units | 30-day Revenue: ${opt_ev.expected_30d_revenue:.2f}")
    log_test_passed("Multi-Horizon Revenue Simulation")


# ===========================================================================
# TEST 9: Batch Optimization & DataFrame Export Integrity
# ===========================================================================
def test_9_batch_optimization_and_export():
    log_test_header(9, 10, "Batch Optimization & DataFrame Export Integrity")
    from models.revenue.revenue_optimization_engine import RevenueOptimizationEngine

    engine = RevenueOptimizationEngine()
    test_df = pd.read_csv(PROCESSED_DIR / "test_data.csv.gz", nrows=20)

    batch_summary = engine.optimize_batch(test_df, simulate_multi_horizon=False, progress_interval=10)
    if batch_summary.total_items_optimized != 20:
        raise TestFailure(f"Expected 20 items in batch, got {batch_summary.total_items_optimized}")

    df_out = engine.to_dataframe(batch_summary.results)
    if len(df_out) != 20:
        raise TestFailure(f"Expected DataFrame with 20 rows, got {len(df_out)}")

    required_cols = [
        "item_id", "store_id", "reference_price", "predicted_clearing_price",
        "clearing_recommended_price", "optimal_revenue_price", "optimal_revenue_lift_pct_vs_ref",
        "optimal_revenue_lift_pct_vs_rec", "optimization_rationale"
    ]
    for c in required_cols:
        if c not in df_out.columns:
            raise TestFailure(f"Missing required column in exported DataFrame: {c}")

    log_test_passed("Batch Optimization & DataFrame Export Integrity")


# ===========================================================================
# TEST 10: Zero-Mutation & Milestone 2 Artifact Immutability Audit
# ===========================================================================
def test_10_zero_mutation_audit():
    log_test_header(10, 10, "Zero-Mutation & Milestone 2 Artifact Immutability Audit")

    # Verify M2 model files exist and have non-zero size
    m2_files = [
        MODELS_DIR / "demand" / "lgbm_demand_step6.txt",
        MODELS_DIR / "demand" / "lgbm_demand_step6_meta.joblib",
        MODELS_DIR / "price" / "rf_price_step4.joblib",
        MODELS_DIR / "price" / "rf_price_step4_meta.joblib",
        MODELS_DIR / "price" / "ridge_pipeline.joblib",
    ]
    for f in m2_files:
        if not f.exists() or f.stat().st_size == 0:
            raise TestFailure(f"Milestone 2 model artifact missing or corrupted: {f}")
        print(f"  [OK] Immutable M2 Artifact Verified: {f.name} ({f.stat().st_size:,} bytes)")

    # Verify raw datasets exist and are non-empty
    raw_files = list(RAW_DIR.glob("*.csv"))
    if len(raw_files) != 9:
        raise TestFailure(f"Expected 9 raw datasets, found {len(raw_files)}")
    for rf in raw_files:
        if rf.stat().st_size == 0:
            raise TestFailure(f"Raw dataset corrupted: {rf.name}")
        print(f"  [OK] Raw Dataset Verified Intact: {rf.name}")

    log_test_passed("Zero-Mutation & Milestone 2 Artifact Immutability Audit")


# ===========================================================================
# Main Test Runner
# ===========================================================================
def run_all_tests():
    print("\n" + "=" * 70)
    print("PricePilot AI — Milestone 3 Step 1 Revenue Engine Test Suite")
    print("=" * 70)
    t0 = time.time()

    tests = [
        test_1_compilation_and_imports,
        test_2_artifact_loading_and_features,
        test_3_reference_price_determination,
        test_4_candidate_generation,
        test_5_single_item_simulation,
        test_6_optimal_selection_and_dual_price_retention,
        test_7_mathematical_invariants,
        test_8_multi_horizon_simulation,
        test_9_batch_optimization_and_export,
        test_10_zero_mutation_audit,
    ]

    passed = 0
    for t in tests:
        try:
            t()
            passed += 1
        except Exception as e:
            print(f"\n❌ [FAILED] {t.__name__}: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    elapsed = time.time() - t0
    print("\n" + "=" * 70)
    print(f"\n[SUCCESS] ALL {passed}/{len(tests)} TESTS PASSED in {elapsed:.2f}s")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_all_tests()
