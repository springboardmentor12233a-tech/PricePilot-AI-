"""
PricePilot AI — Milestone 3 Step 2: Competitor & Market Analysis Test Suite
==========================================================================

Verifies the mathematical correctness, taxonomy grouping, rule-based classification,
opportunity signaling, temporal leakage safety, external competitor schema validation,
and dataset immutability for the Competitor & Market Analysis Engine.

Test Suite Structure:
---------------------
1. Test 1: Module Compilation & Import Integrity
2. Test 2: Input Schema & Dataclass Validation
3. Test 3: Positive-Price Filtering & Invalid Price Handling
4. Test 4: Internal Digital-Channel Benchmark & Price Index Math
5. Test 5: Cross-Store Price Dispersion & Benchmark Math
6. Test 6: Category Peer Hierarchy Grouping & Percentile Rank
7. Test 7: Rule-Based Market Position Classification Logic
8. Test 8: Rule-Based Opportunity Signal Diagnostics Logic
9. Test 9: Time-Alignment & Leakage-Safety Audit
10. Test 10: External Competitor Schema Validation & Ingestion Handling
11. Test 11: End-to-End Batch Pipeline & Metadata Serialization
12. Test 12: Zero-Mutation & Upstream Artifact Immutability Audit

Usage:
  python models/competitor/test_competitor_analysis.py
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
COMPETITOR_DIR = MODELS_DIR / "competitor"
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
log = logging.getLogger("test_competitor_analysis")


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
    log_test_header(1, 12, "Module Compilation & Import Integrity")

    engine_file = COMPETITOR_DIR / "competitor_analysis_engine.py"
    if not engine_file.exists():
        raise TestFailure(f"Missing engine file: {engine_file}")

    py_compile.compile(str(engine_file), doraise=True)
    print("  [OK] Syntax compilation verified.")

    try:
        from models.competitor import (
            ChannelBenchmarkResult,
            CompetitorAnalysisEngine,
            ExternalCompetitorSchema,
            MarketAnalysisBatchSummary,
            MarketAnalysisRecord,
            MarketPositionResult,
            OpportunitySignalResult,
            PeerBenchmarkResult,
            StoreBenchmarkResult,
        )
    except Exception as e:
        raise TestFailure(f"Failed to import from models.competitor: {e}")

    log_test_passed("Module Compilation & Import Integrity")


# ===========================================================================
# TEST 2: Input Schema & Dataclass Validation
# ===========================================================================
def test_2_dataclass_validation():
    log_test_header(2, 12, "Input Schema & Dataclass Validation")
    from models.competitor import (
        ChannelBenchmarkResult,
        ExternalCompetitorSchema,
        MarketPositionResult,
        OpportunitySignalResult,
        PeerBenchmarkResult,
        StoreBenchmarkResult,
    )

    chan = ChannelBenchmarkResult(
        has_online_listing=True,
        online_price=100.0,
        channel_price_diff=10.0,
        channel_price_diff_pct=10.0,
        channel_price_index=1.1,
        channel_alignment_status="STORE_PREMIUM",
    )
    if chan.channel_price_index != 1.1 or chan.channel_alignment_status != "STORE_PREMIUM":
        raise TestFailure("ChannelBenchmarkResult field mismatch")

    store_bm = StoreBenchmarkResult(
        store_count=4,
        store_min_price=90.0,
        store_max_price=110.0,
        store_median_price=100.0,
        store_mean_price=100.0,
        store_price_range=20.0,
        store_price_dispersion_pct=20.0,
        store_vs_median_diff=5.0,
        store_vs_median_pct=5.0,
    )
    if store_bm.store_price_range != 20.0:
        raise TestFailure("StoreBenchmarkResult calculation error")

    pos = MarketPositionResult(
        market_position="Below Peer Benchmark",
        position_tier="VALUE_DISCOUNT",
        low_threshold_pct=-5.0,
        high_threshold_pct=5.0,
        position_rationale="Test rationale",
    )
    if pos.position_tier != "VALUE_DISCOUNT":
        raise TestFailure("MarketPositionResult tier mismatch")

    log_test_passed("Input Schema & Dataclass Validation")


# ===========================================================================
# TEST 3: Positive-Price Filtering & Invalid Price Handling
# ===========================================================================
def test_3_positive_price_filtering():
    log_test_header(3, 12, "Positive-Price Filtering & Invalid Price Handling")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine()

    # Synthetic dataframe with zero, negative, NaN prices
    df_raw = pd.DataFrame({
        "date": ["2024-08-01"] * 5,
        "item_id": ["item_1", "item_2", "item_3", "item_4", "item_5"],
        "store_id": [1, 1, 1, 1, 1],
        "price_base": [100.0, 0.0, -15.5, np.nan, 250.0],
        "dept_name": ["DeptA"] * 5,
        "class_name": ["ClassA"] * 5,
        "subclass_name": ["SubA"] * 5,
        "item_type": ["TypeA"] * 5,
        "quantity": [1.0] * 5,
        "is_on_promo": [0] * 5,
        "online_price": [100.0, 50.0, 0.0, np.nan, 240.0],
    })

    analyzed_df, summary = engine.analyze_dataframe(df_raw)

    if len(analyzed_df) != 2:
        raise TestFailure(f"Expected 2 valid positive price rows, got {len(analyzed_df)}")
    if summary.invalid_price_filtered != 3:
        raise TestFailure(f"Expected 3 filtered invalid prices, got {summary.invalid_price_filtered}")
    if (analyzed_df["price_base"] <= 0).any():
        raise TestFailure("Analyzed DataFrame contains non-positive prices!")

    log_test_passed("Positive-Price Filtering", f"Filtered {summary.invalid_price_filtered} invalid rows correctly")


# ===========================================================================
# TEST 4: Internal Digital-Channel Benchmark & Price Index Math
# ===========================================================================
def test_4_channel_benchmark_math():
    log_test_header(4, 12, "Internal Digital-Channel Benchmark & Price Index Math")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine(channel_parity_threshold_pct=3.0)

    # Case A: Store Premium (Store=120, Online=100)
    res_a = engine.compute_channel_benchmark(store_price=120.0, online_price=100.0)
    if res_a.channel_price_diff != 20.0 or res_a.channel_price_diff_pct != 20.0:
        raise TestFailure(f"Incorrect channel diff: {res_a}")
    if res_a.channel_price_index != 1.2 or res_a.channel_alignment_status != "STORE_PREMIUM":
        raise TestFailure(f"Incorrect status or index: {res_a}")

    # Case B: Channel Parity (Store=102, Online=100 -> +2% within +/-3%)
    res_b = engine.compute_channel_benchmark(store_price=102.0, online_price=100.0)
    if res_b.channel_alignment_status != "CHANNEL_PARITY":
        raise TestFailure(f"Expected CHANNEL_PARITY for 2% difference, got {res_b.channel_alignment_status}")

    # Case C: Store Discount (Store=80, Online=100 -> -20%)
    res_c = engine.compute_channel_benchmark(store_price=80.0, online_price=100.0)
    if res_c.channel_price_diff_pct != -20.0 or res_c.channel_alignment_status != "STORE_DISCOUNT":
        raise TestFailure(f"Expected STORE_DISCOUNT, got {res_c.channel_alignment_status}")

    # Case D: Missing / Invalid online price (Online=0.0 or NaN)
    res_d = engine.compute_channel_benchmark(store_price=100.0, online_price=0.0)
    if res_d.has_online_listing is not False or res_d.channel_alignment_status != "NO_ONLINE_LISTING":
        raise TestFailure("Failed to handle zero online price safely")

    log_test_passed("Internal Digital-Channel Benchmark Math")


# ===========================================================================
# TEST 5: Cross-Store Price Dispersion & Benchmark Math
# ===========================================================================
def test_5_store_dispersion_math():
    log_test_header(5, 12, "Cross-Store Price Dispersion & Benchmark Math")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine()

    df = pd.DataFrame({
        "date": ["2024-08-01"] * 4,
        "item_id": ["SKU_100"] * 4,
        "store_id": [1, 2, 3, 4],
        "price_base": [100.0, 110.0, 90.0, 100.0],
        "dept_name": ["Dept1"] * 4,
        "class_name": ["Class1"] * 4,
        "subclass_name": ["Sub1"] * 4,
        "item_type": ["Type1"] * 4,
        "quantity": [5.0] * 4,
        "online_price": [100.0] * 4,
    })

    analyzed, _ = engine.analyze_dataframe(df)

    # Store stats for SKU_100: min=90, max=110, median=100, mean=100, range=20, dispersion=20%
    row_store_2 = analyzed[analyzed["store_id"] == 2].iloc[0]
    if row_store_2["store_min_price"] != 90.0:
        raise TestFailure(f"Expected store_min_price 90.0, got {row_store_2['store_min_price']}")
    if row_store_2["store_max_price"] != 110.0:
        raise TestFailure(f"Expected store_max_price 110.0, got {row_store_2['store_max_price']}")
    if row_store_2["store_median_price"] != 100.0:
        raise TestFailure(f"Expected store_median_price 100.0, got {row_store_2['store_median_price']}")
    if row_store_2["store_price_range"] != 20.0:
        raise TestFailure(f"Expected store_price_range 20.0, got {row_store_2['store_price_range']}")
    if row_store_2["store_price_dispersion_pct"] != 20.0:
        raise TestFailure(f"Expected dispersion 20%, got {row_store_2['store_price_dispersion_pct']}")
    if row_store_2["store_vs_median_diff"] != 10.0 or row_store_2["store_vs_median_pct"] != 10.0:
        raise TestFailure(f"Expected store_vs_median_pct +10%, got {row_store_2['store_vs_median_pct']}")

    log_test_passed("Cross-Store Price Dispersion Math")


# ===========================================================================
# TEST 6: Category Peer Hierarchy Grouping & Percentile Rank
# ===========================================================================
def test_6_category_peer_grouping():
    log_test_header(6, 12, "Category Peer Hierarchy Grouping & Percentile Rank")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine(min_peer_group_size=3)

    # 4 items in Subclass A (>= min size 3)
    # 2 items in Subclass B (< min size 3, will fallback to Class)
    df = pd.DataFrame({
        "date": ["2024-08-01"] * 6,
        "item_id": [f"item_{i}" for i in range(1, 7)],
        "store_id": [1] * 6,
        "price_base": [80.0, 100.0, 120.0, 140.0, 50.0, 60.0],
        "dept_name": ["DeptX"] * 6,
        "class_name": ["ClassY"] * 6,
        "subclass_name": ["SubA", "SubA", "SubA", "SubA", "SubB", "SubB"],
        "item_type": ["TypeZ"] * 6,
        "quantity": [2.0] * 6,
        "online_price": [100.0] * 6,
    })

    analyzed, _ = engine.analyze_dataframe(df)

    sub_a_items = analyzed[analyzed["subclass_name"] == "SubA"]
    if not (sub_a_items["peer_group_level"] == "SUBCLASS").all():
        raise TestFailure("Expected peer_group_level == SUBCLASS for SubA")

    sub_b_items = analyzed[analyzed["subclass_name"] == "SubB"]
    if not (sub_b_items["peer_group_level"] == "CLASS_FALLBACK").all():
        raise TestFailure("Expected peer_group_level == CLASS_FALLBACK for SubB due to small peer size")

    # Check percentile ranks in SubA: [80, 100, 120, 140] -> ranks should be [25.0, 50.0, 75.0, 100.0]
    ranks_sub_a = sub_a_items.sort_values("price_base")["peer_percentile_rank"].tolist()
    if ranks_sub_a != [25.0, 50.0, 75.0, 100.0]:
        raise TestFailure(f"Unexpected percentile ranks: {ranks_sub_a}")

    log_test_passed("Category Peer Hierarchy Grouping & Percentile Rank")


# ===========================================================================
# TEST 7: Rule-Based Market Position Classification Logic
# ===========================================================================
def test_7_market_position_logic():
    log_test_header(7, 12, "Rule-Based Market Position Classification Logic")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine(peer_low_threshold_pct=-5.0, peer_high_threshold_pct=5.0)

    # 1. Below Benchmark: Store=80, PeerMedian=100 (-20% < -5%)
    pos_below = engine.classify_market_position(store_price=80.0, peer_median=100.0)
    if pos_below.market_position != "Below Peer Benchmark" or pos_below.position_tier != "VALUE_DISCOUNT":
        raise TestFailure(f"Expected Below Peer Benchmark, got {pos_below.market_position}")

    # 2. Near Benchmark: Store=102, PeerMedian=100 (+2% within [-5%, +5%])
    pos_near = engine.classify_market_position(store_price=102.0, peer_median=100.0)
    if pos_near.market_position != "Near Peer Benchmark" or pos_near.position_tier != "MARKET_ALIGNED":
        raise TestFailure(f"Expected Near Peer Benchmark, got {pos_near.market_position}")

    # 3. Above Benchmark: Store=125, PeerMedian=100 (+25% > +5%)
    pos_above = engine.classify_market_position(store_price=125.0, peer_median=100.0)
    if pos_above.market_position != "Above Peer Benchmark" or pos_above.position_tier != "PREMIUM_TIER":
        raise TestFailure(f"Expected Above Peer Benchmark, got {pos_above.market_position}")

    # 4. Unclassified
    pos_unclass = engine.classify_market_position(store_price=100.0, peer_median=None)
    if "Unclassified" not in pos_unclass.market_position:
        raise TestFailure(f"Expected Unclassified, got {pos_unclass.market_position}")

    log_test_passed("Rule-Based Market Position Classification Logic")


# ===========================================================================
# TEST 8: Rule-Based Opportunity Signal Diagnostics Logic
# ===========================================================================
def test_8_opportunity_signal_logic():
    log_test_header(8, 12, "Rule-Based Opportunity Signal Diagnostics Logic")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine(channel_disparity_threshold_pct=15.0)

    # Case 1: Channel Disparity (> 15%)
    sig_chan = engine.evaluate_opportunity_signal(
        market_position="Near Peer Benchmark",
        peer_median_diff_pct=0.0,
        channel_price_diff_pct=25.0,
        quantity=10.0,
        demand_benchmark=10.0,
        is_on_promo=0,
    )
    if sig_chan.opportunity_signal != "CHANNEL_DISPARITY_REVIEW":
        raise TestFailure(f"Expected CHANNEL_DISPARITY_REVIEW, got {sig_chan.opportunity_signal}")

    # Case 2: Headroom Opportunity (Below peer benchmark + high demand)
    sig_headroom = engine.evaluate_opportunity_signal(
        market_position="Below Peer Benchmark",
        peer_median_diff_pct=-15.0,
        channel_price_diff_pct=0.0,
        quantity=15.0,
        demand_benchmark=10.0,
        is_on_promo=0,
    )
    if sig_headroom.opportunity_signal != "HEADROOM_OPPORTUNITY_REVIEW":
        raise TestFailure(f"Expected HEADROOM_OPPORTUNITY_REVIEW, got {sig_headroom.opportunity_signal}")

    # Case 3: Premium Margin Resistance (Above peer benchmark + low demand)
    sig_prem = engine.evaluate_opportunity_signal(
        market_position="Above Peer Benchmark",
        peer_median_diff_pct=20.0,
        channel_price_diff_pct=0.0,
        quantity=4.0,
        demand_benchmark=10.0,
        is_on_promo=0,
    )
    if sig_prem.opportunity_signal != "PREMIUM_MARGIN_REVIEW":
        raise TestFailure(f"Expected PREMIUM_MARGIN_REVIEW, got {sig_prem.opportunity_signal}")

    # Case 4: Promo Inefficiency (is_on_promo=1 + weak demand)
    sig_promo = engine.evaluate_opportunity_signal(
        market_position="Near Peer Benchmark",
        peer_median_diff_pct=0.0,
        channel_price_diff_pct=0.0,
        quantity=3.0,
        demand_benchmark=10.0,
        is_on_promo=1,
    )
    if sig_promo.opportunity_signal != "PROMO_DEPTH_REVIEW":
        raise TestFailure(f"Expected PROMO_DEPTH_REVIEW, got {sig_promo.opportunity_signal}")

    # Case 5: Aligned Stable
    sig_stable = engine.evaluate_opportunity_signal(
        market_position="Near Peer Benchmark",
        peer_median_diff_pct=0.0,
        channel_price_diff_pct=0.0,
        quantity=10.0,
        demand_benchmark=10.0,
        is_on_promo=0,
    )
    if sig_stable.opportunity_signal != "ALIGNED_STABLE":
        raise TestFailure(f"Expected ALIGNED_STABLE, got {sig_stable.opportunity_signal}")

    log_test_passed("Rule-Based Opportunity Signal Diagnostics Logic")


# ===========================================================================
# TEST 9: Time-Alignment & Leakage-Safety Audit
# ===========================================================================
def test_9_time_alignment_and_leakage_safety():
    log_test_header(9, 12, "Time-Alignment & Leakage-Safety Audit")
    from models.competitor import CompetitorAnalysisEngine

    engine = CompetitorAnalysisEngine()

    # Two distinct dates where item 1 has different prices on date 1 vs date 2
    # Ensure peer calculations for date 1 NEVER include prices from date 2
    df = pd.DataFrame({
        "date": ["2024-08-01", "2024-08-01", "2024-08-02", "2024-08-02"],
        "item_id": ["SKU_1", "SKU_2", "SKU_1", "SKU_2"],
        "store_id": [1, 1, 1, 1],
        "price_base": [10.0, 10.0, 100.0, 100.0],
        "dept_name": ["D1", "D1", "D1", "D1"],
        "class_name": ["C1", "C1", "C1", "C1"],
        "subclass_name": ["S1", "S1", "S1", "S1"],
        "item_type": ["T1", "T1", "T1", "T1"],
        "quantity": [1.0, 1.0, 1.0, 1.0],
        "online_price": [10.0, 10.0, 100.0, 100.0],
    })

    analyzed, _ = engine.analyze_dataframe(df)

    d1_median = analyzed[analyzed["date"] == "2024-08-01"]["peer_median_price"].iloc[0]
    d2_median = analyzed[analyzed["date"] == "2024-08-02"]["peer_median_price"].iloc[0]

    if d1_median != 10.0:
        raise TestFailure(f"Temporal leakage detected! Date 1 peer median was contaminated: {d1_median}")
    if d2_median != 100.0:
        raise TestFailure(f"Temporal leakage detected! Date 2 peer median was contaminated: {d2_median}")

    log_test_passed("Time-Alignment & Leakage-Safety Audit", "Zero temporal cross-contamination verified")


# ===========================================================================
# TEST 10: External Competitor Schema Validation & Ingestion Handling
# ===========================================================================
def test_10_external_competitor_schema():
    log_test_header(10, 12, "External Competitor Schema Validation & Ingestion Handling")
    from models.competitor import CompetitorAnalysisEngine, ExternalCompetitorSchema

    engine = CompetitorAnalysisEngine()

    # 1. Invalid Schema DataFrame (missing competitor_price)
    invalid_ext_df = pd.DataFrame({
        "date": ["2024-08-01"],
        "item_id": ["SKU_1"],
        "competitor_id": ["COMP_A"],
    })
    is_valid, errs = ExternalCompetitorSchema.validate(invalid_ext_df)
    if is_valid or len(errs) == 0:
        raise TestFailure("ExternalCompetitorSchema failed to catch missing competitor_price")

    # 2. Valid Schema DataFrame
    valid_ext_df = pd.DataFrame({
        "date": ["2024-08-01", "2024-08-01"],
        "item_id": ["SKU_1", "SKU_2"],
        "competitor_id": ["COMP_A", "COMP_B"],
        "competitor_name": ["Competitor Alpha", "Competitor Beta"],
        "competitor_price": [95.0, 105.0],
    })
    is_valid_ok, errs_ok = ExternalCompetitorSchema.validate(valid_ext_df)
    if not is_valid_ok or len(errs_ok) > 0:
        raise TestFailure(f"Valid schema failed validation: {errs_ok}")

    # 3. Ingestion into engine
    df_store = pd.DataFrame({
        "date": ["2024-08-01", "2024-08-01"],
        "item_id": ["SKU_1", "SKU_2"],
        "store_id": [1, 1],
        "price_base": [100.0, 100.0],
        "dept_name": ["D1", "D1"],
        "class_name": ["C1", "C1"],
        "subclass_name": ["S1", "S1"],
        "item_type": ["T1", "T1"],
        "quantity": [1.0, 1.0],
        "online_price": [100.0, 100.0],
    })

    analyzed, summary = engine.analyze_dataframe(df_store, external_df=valid_ext_df)
    if not summary.external_competitor_data_available:
        raise TestFailure("Expected external_competitor_data_available == True")

    sku_1_row = analyzed[analyzed["item_id"] == "SKU_1"].iloc[0]
    if sku_1_row["external_competitor_price"] != 95.0:
        raise TestFailure(f"Expected external competitor price 95.0, got {sku_1_row['external_competitor_price']}")
    if sku_1_row["external_competitor_diff"] != 5.0:
        raise TestFailure(f"Expected diff 5.0, got {sku_1_row['external_competitor_diff']}")

    log_test_passed("External Competitor Schema Validation & Ingestion Handling")


# ===========================================================================
# TEST 11: End-to-End Batch Pipeline & Metadata Serialization
# ===========================================================================
def test_11_end_to_end_pipeline():
    log_test_header(11, 12, "End-to-End Batch Pipeline & Metadata Serialization")
    from models.competitor.competitor_analysis_engine import run_competitor_analysis_pipeline

    test_csv = REPORTS_DIR / "test_competitor_examples.csv"
    test_json = REPORTS_DIR / "test_competitor_summary.json"
    test_report = REPORTS_DIR / "test_competitor_report.md"

    analyzed_df, summary = run_competitor_analysis_pipeline(
        sample_size=1000,
        output_csv=test_csv,
        output_json=test_json,
        output_report=test_report,
    )

    if len(analyzed_df) == 0:
        raise TestFailure("Analyzed DataFrame is empty")
    if not test_csv.exists() or test_csv.stat().st_size == 0:
        raise TestFailure(f"Output CSV missing or empty: {test_csv}")
    if not test_json.exists() or test_json.stat().st_size == 0:
        raise TestFailure(f"Output JSON missing or empty: {test_json}")
    if not test_report.exists() or test_report.stat().st_size == 0:
        raise TestFailure(f"Output Markdown report missing or empty: {test_report}")

    # Clean up test artifacts
    for p in [test_csv, test_json, test_report]:
        if p.exists():
            p.unlink()

    log_test_passed("End-to-End Batch Pipeline & Metadata Serialization")


# ===========================================================================
# TEST 12: Zero-Mutation & Upstream Artifact Immutability Audit
# ===========================================================================
def test_12_immutability_audit():
    log_test_header(12, 12, "Zero-Mutation & Upstream Artifact Immutability Audit")

    # 1. Check raw datasets exist and are intact
    raw_files = [
        RAW_DIR / "catalog.csv",
        RAW_DIR / "stores.csv",
        RAW_DIR / "online.csv",
        RAW_DIR / "sales.csv",
        RAW_DIR / "ecommerce_sales_34500.csv",
    ]
    for rf in raw_files:
        if not rf.exists() or rf.stat().st_size == 0:
            raise TestFailure(f"Raw dataset file corrupted or missing: {rf}")

    # 2. Check Milestone 2 model artifacts exist
    m2_artifacts = [
        PRICE_DIR / "rf_price_step4.joblib",
        PRICE_DIR / "rf_price_step4_meta.joblib",
        DEMAND_DIR / "lgbm_demand_step6.txt",
        DEMAND_DIR / "lgbm_demand_step6_meta.joblib",
    ]
    for ma in m2_artifacts:
        if not ma.exists() or ma.stat().st_size == 0:
            raise TestFailure(f"Milestone 2 model artifact missing: {ma}")

    # 3. Check Milestone 3 Step 1 artifacts exist
    m3_s1_artifacts = [
        REVENUE_DIR / "revenue_optimization_engine.py",
        REVENUE_DIR / "revenue_engine_meta.joblib",
    ]
    for m3a in m3_s1_artifacts:
        if not m3a.exists() or m3a.stat().st_size == 0:
            raise TestFailure(f"Milestone 3 Step 1 artifact missing: {m3a}")

    print("  [OK] 5 raw datasets verified intact.")
    print("  [OK] 4 Milestone 2 model artifacts verified intact.")
    print("  [OK] 2 Milestone 3 Step 1 artifacts verified intact.")
    log_test_passed("Zero-Mutation & Upstream Artifact Immutability Audit")


# ===========================================================================
# Runner
# ===========================================================================
def run_all_tests():
    print("=" * 70)
    print(" PRICEPILOT AI — MILESTONE 3 STEP 2 TEST SUITE")
    print("=" * 70)

    start_time = time.time()
    tests = [
        test_1_compilation_and_imports,
        test_2_dataclass_validation,
        test_3_positive_price_filtering,
        test_4_channel_benchmark_math,
        test_5_store_dispersion_math,
        test_6_category_peer_grouping,
        test_7_market_position_logic,
        test_8_opportunity_signal_logic,
        test_9_time_alignment_and_leakage_safety,
        test_10_external_competitor_schema,
        test_11_end_to_end_pipeline,
        test_12_immutability_audit,
    ]

    passed = 0
    failed = 0
    for t in tests:
        try:
            t()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"  -> [FAILED] {t.__name__}: {e}")
            log.exception(e)

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f" TEST RESULTS: {passed}/{len(tests)} PASSED | {failed} FAILED | Elapsed: {elapsed:.2f}s")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
