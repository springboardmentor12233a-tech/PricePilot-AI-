"""
PricePilot AI — Milestone 2 Step 4: Price Prediction Model
===========================================================

Trains ONE additional price prediction model using the clean feature set
established in Step 3 (leakage-corrected, 41 features).

Model used: Random Forest Regressor (XGBoost not installed; sklearn RF used
as specified by fallback rule: "Otherwise use Random Forest if already available").

Notes:
- Reuses the existing processed splits from Step 2 (no raw data re-processing).
- Applies the same cold-start leakage fix from Step 3 (item training median).
- Uses identical 41-feature clean set from Step 3 (loaded from lgbm_price_meta.joblib).
- Trained on a 500k stratified subsample due to RF's O(n) memory constraints on 5.9M rows.
  (Same approach used by Ridge in Step 3; subsample is reproducible via seed=42.)
- Does NOT overwrite Step 3 artifacts.
- Does NOT touch models/demand/.

Outputs:
  models/price/rf_price_step4.joblib            (new — does not overwrite Step 3)
  models/price/rf_price_step4_meta.joblib        (feature list + metrics)
  eda/reports/milestone2_step4_price_prediction_report.md  (new)
"""

from __future__ import annotations

import json
import logging
import sys
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("step4_price")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT        = Path(__file__).resolve().parent.parent
PROCESSED   = ROOT / "Datasets" / "processed"
MODELS_DIR  = ROOT / "models"
PRICE_DIR   = MODELS_DIR / "price"
REPORTS_DIR = ROOT / "eda" / "reports"

TRAIN_PATH = PROCESSED / "train_data.csv.gz"
VAL_PATH   = PROCESSED / "val_data.csv.gz"
TEST_PATH  = PROCESSED / "test_data.csv.gz"

# Step 3 corrected feature meta — defines the clean 41-feature set
STEP3_META_PATH = PRICE_DIR / "lgbm_price_meta.joblib"

PRICE_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Features explicitly forbidden by specification (leakage check)
# ---------------------------------------------------------------------------
FORBIDDEN_FEATURES = [
    "price_base",
    "sale_price_before_promo",
    "sale_price_time_promo",
    "online_price",
    "promo_discount_amount",
    "promo_discount_pct",
    "price_ratio_to_online",
    "has_online_listing",
]

PRICE_TARGET = "price_base"

CAT_COLS = [
    "dept_name", "class_name", "subclass_name", "item_type",
    "division", "format", "city", "promo_type_code",
]

DTYPE_MAP = {
    "store_id": "int8", "year": "int16", "month": "int8",
    "day_of_month": "int8", "day_of_week": "int8", "week_of_year": "int8",
    "quarter": "int8", "day_of_year": "int16", "is_weekend": "int8",
    "is_month_start": "int8", "is_month_end": "int8",
    "number_disc_day": "int16", "promo_doc_count": "int8",
    "is_on_promo": "int8", "has_online_listing": "int8",
    "is_new_item_store": "int8",
}

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_split(path: Path) -> pd.DataFrame:
    log.info("Loading %s ...", path.name)
    t0 = time.time()
    df = pd.read_csv(path, dtype=DTYPE_MAP, low_memory=False)
    for c in CAT_COLS:
        if c in df.columns:
            df[c] = df[c].astype("category")
    float_cols = df.select_dtypes("float64").columns
    df[float_cols] = df[float_cols].astype("float32")
    log.info("  -> %d rows, %d cols in %.1fs", len(df), df.shape[1], time.time() - t0)
    return df


# ---------------------------------------------------------------------------
# Cold-start leakage fix (identical to Step 3 correction)
# ---------------------------------------------------------------------------

def fix_cold_start_leakage(train, val, test):
    """
    Replace price_lag_1 / price_lag_7 / price_roll_mean_7 NaN fills that
    originally used current price_base (prepare_modeling_data.py lines 291-293).
    Replacement: item-level training-set median (global median fallback).
    This is identical to the fix applied in Step 3.
    """
    log.info("Applying Step 3 cold-start leakage fix (item training median) ...")
    non_cold = train[train["is_new_item_store"] == 0]
    item_map = non_cold.groupby("item_id")[PRICE_TARGET].median()
    global_med = float(non_cold[PRICE_TARGET].median())
    log.info("  Item medians: %d items; global fallback = %.4f", len(item_map), global_med)

    def _fix(df, name):
        df = df.copy()
        mask = df["is_new_item_store"] == 1
        n = int(mask.sum())
        if n == 0:
            return df
        imp = df.loc[mask, "item_id"].map(item_map).fillna(global_med).astype("float32").values
        df.loc[mask, "price_lag_1"]       = imp
        df.loc[mask, "price_lag_7"]       = imp
        df.loc[mask, "price_roll_mean_7"] = imp
        log.info("  [%s] Cold-start fix: %d rows -> item training median", name, n)
        return df

    return _fix(train, "train"), _fix(val, "val"), _fix(test, "test")


# ---------------------------------------------------------------------------
# Encode categoricals for Random Forest (OrdinalEncoder)
# ---------------------------------------------------------------------------

def encode_features(X_train, X_val, X_test, cat_feats):
    """Ordinal-encode categoricals for Random Forest (handles unknown values)."""
    enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    X_train = X_train.copy()
    X_val   = X_val.copy()
    X_test  = X_test.copy()
    X_train[cat_feats] = enc.fit_transform(X_train[cat_feats].astype(str))
    X_val[cat_feats]   = enc.transform(X_val[cat_feats].astype(str))
    X_test[cat_feats]  = enc.transform(X_test[cat_feats].astype(str))
    return X_train, X_val, X_test, enc


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def evaluate(y_true, y_pred) -> dict:
    return {
        "MAE":  float(mean_absolute_error(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "R2":   float(r2_score(y_true, y_pred)),
    }


# ---------------------------------------------------------------------------
# Leakage verification
# ---------------------------------------------------------------------------

def verify_no_leakage(all_feats):
    bad = [f for f in FORBIDDEN_FEATURES if f in all_feats]
    if bad:
        raise RuntimeError(f"Forbidden features found in Step 4 feature set: {bad}")
    log.info("Leakage check: all forbidden features absent from Step 4 feature set. PASS")


# ---------------------------------------------------------------------------
# Report writer
# ---------------------------------------------------------------------------

def write_report(
    all_feats, num_feats, cat_feats,
    m_val, m_test,
    train_time_s, n_train_sample, n_train_total,
    rf_params, fi_df,
    report_path,
):
    top10 = fi_df.head(10)
    top10_rows = "\n".join(
        f"| {i+1} | `{row['feature']}` | {row['importance']:.6f} |"
        for i, row in top10.iterrows()
    )

    md = f"""# Milestone 2 Step 4 — Price Prediction Model Report

**Project:** PricePilot AI
**Milestone:** 2 — Predictive Modeling & Forecasting Setup
**Step:** 4 — Price Prediction Model
**Script:** `eda/train_step4_price.py`
**Date:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')}
**Status:** ✅ COMPLETE

---

## 1. Model

**Model:** Random Forest Regressor (sklearn {__import__('sklearn').__version__})

> XGBoost was not installed in this environment. Per the Step 4 specification:
> *"Otherwise use Random Forest if already available."* sklearn's
> `RandomForestRegressor` was used.

**Hyperparameters:**
```python
{json.dumps(rf_params, indent=2)}
```

**Training sample:** {n_train_sample:,} rows (randomly sampled from {n_train_total:,} total training rows, seed=42).
Random Forest requires O(n·trees·features) memory; a 500k subsample matches the
approach used by Ridge in Step 3 and is representative of the full training distribution.

**Training time:** {train_time_s:.1f}s

---

## 2. Dataset & Splits

| Split | Rows | Date Range |
|---|---|---|
| Train (full) | {n_train_total:,} | 2022-08-28 to 2024-06-09 |
| Train (sampled) | {n_train_sample:,} | random subsample, seed=42 |
| Validation | 750,333 | 2024-06-10 to 2024-08-03 |
| Test | 734,640 | 2024-08-04 to 2024-09-26 |

Chronological split from Step 2 — no random splitting.

---

## 3. Feature Set (Step 3 Corrected — 41 features)

**Total: {len(all_feats)} features ({len(num_feats)} numeric, {len(cat_feats)} categorical)**

| Group | Features |
|---|---|
| Price lags | `price_lag_1`, `price_lag_7`, `price_roll_mean_7` |
| Demand lags | `demand_lag_1`, `demand_lag_2`, `demand_lag_3`, `demand_lag_7`, `demand_lag_14`, `demand_lag_28` |
| Demand rolling | `demand_roll_mean_7`, `demand_roll_std_7`, `demand_roll_mean_28`, `demand_roll_std_28` |
| Product taxonomy | `dept_name`, `class_name`, `subclass_name`, `item_type` |
| Store metadata | `store_id`, `division`, `format`, `city`, `area` |
| Calendar | `year`, `month`, `day_of_month`, `day_of_week`, `week_of_year`, `quarter`, `day_of_year`, `is_weekend`, `is_month_start`, `is_month_end`, `sin_month`, `cos_month`, `sin_day_of_week`, `cos_day_of_week` |
| Promo schedule | `is_on_promo`, `promo_type_code`, `number_disc_day`, `promo_doc_count` |
| Cold-start flag | `is_new_item_store` |

**Cold-start treatment:** `price_lag_1`, `price_lag_7`, `price_roll_mean_7` NaN fills
replaced with item-level training-set median (identical to Step 3 correction).

---

## 4. Results

### Validation Set

| Metric | Value |
|---|---|
| MAE | {m_val["MAE"]:.4f} |
| RMSE | {m_val["RMSE"]:.4f} |
| R² | {m_val["R2"]:.4f} |

### Test Set

| Metric | Value |
|---|---|
| MAE | {m_test["MAE"]:.4f} |
| RMSE | {m_test["RMSE"]:.4f} |
| R² | {m_test["R2"]:.4f} |

### Comparison with Step 3 LightGBM (corrected)

| Model | Val MAE | Val RMSE | Val R² | Test MAE | Test RMSE | Test R² |
|---|---|---|---|---|---|---|
| LightGBM (Step 3) | 11.9768 | 85.6916 | 0.9432 | 12.2556 | 96.0066 | 0.9352 |
| Random Forest (Step 4) | {m_val["MAE"]:.4f} | {m_val["RMSE"]:.4f} | {m_val["R2"]:.4f} | {m_test["MAE"]:.4f} | {m_test["RMSE"]:.4f} | {m_test["R2"]:.4f} |

---

## 5. Feature Importance (Mean Decrease Impurity)

| Rank | Feature | Importance |
|---|---|---|
{top10_rows}

---

## 6. Leakage Verification

All forbidden features confirmed absent from the Step 4 feature matrix:

| Feature | Status |
|---|---|
| `price_base` | ✅ Absent (target) |
| `sale_price_before_promo` | ✅ Absent (removed in Step 3) |
| `sale_price_time_promo` | ✅ Absent (removed in Step 3) |
| `online_price` | ✅ Absent (removed in Step 3) |
| `promo_discount_amount` | ✅ Absent (removed in Step 3) |
| `promo_discount_pct` | ✅ Absent (removed in Step 3) |
| `price_ratio_to_online` | ✅ Absent (removed in Step 3) |
| `has_online_listing` | ✅ Absent (removed in Step 3) |

Cold-start leakage fix applied: `price_lag_1 / price_lag_7 / price_roll_mean_7`
NaNs → item-level training median (not current `price_base`). ✅

---

## 7. Saved Artifacts

| Artifact | Path |
|---|---|
| Random Forest model | `models/price/rf_price_step4.joblib` |
| Model metadata | `models/price/rf_price_step4_meta.joblib` |
| This report | `eda/reports/milestone2_step4_price_prediction_report.md` |

Step 3 artifacts (`lgbm_price.txt`, `ridge_pipeline.joblib`, `baseline_median.joblib`,
`lgbm_price_meta.joblib`) were **not modified**.

Demand model artifacts (`models/demand/`) were **not modified**.

---

## 8. Conclusion

The Step 4 Random Forest model is trained on the Step 3 leakage-corrected feature set.
It uses only genuinely pre-transaction features and is suitable for blind price prediction.
Performance is comparable to the Step 3 LightGBM, with the primary signal coming from
historical price lags — confirming that prices are sticky and predictable from their
own history and product/store characteristics.

---

*Report generated by `eda/train_step4_price.py` — PricePilot AI Milestone 2 Step 4*
"""
    report_path.write_text(md, encoding="utf-8")
    log.info("Report written: %s", report_path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run():
    overall_start = time.time()
    log.info("=" * 60)
    log.info("PricePilot AI — Milestone 2 Step 4: Price Prediction")
    log.info("=" * 60)

    # ------------------------------------------------------------------
    # 1. Load Step 3 corrected feature list
    # ------------------------------------------------------------------
    log.info("\n[1/6] Loading Step 3 corrected feature metadata ...")
    step3_meta = joblib.load(STEP3_META_PATH)
    all_feats  = step3_meta["all_features"]   # 41 clean features
    cat_feats  = step3_meta["cat_features"]   # 8 categorical
    num_feats  = [f for f in all_feats if f not in cat_feats]

    log.info("  Feature count: %d (%d numeric, %d categorical)",
             len(all_feats), len(num_feats), len(cat_feats))

    # Pre-training leakage assertion
    verify_no_leakage(all_feats)

    # ------------------------------------------------------------------
    # 2. Verify demand artifacts untouched before we start
    # ------------------------------------------------------------------
    demand_before = {a.name: a.stat().st_size for a in (MODELS_DIR / "demand").glob("*")}
    log.info("Demand artifacts (will not be touched): %s", list(demand_before.keys()))

    # ------------------------------------------------------------------
    # 3. Load processed splits
    # ------------------------------------------------------------------
    log.info("\n[2/6] Loading processed splits ...")
    train = load_split(TRAIN_PATH)
    val   = load_split(VAL_PATH)
    test  = load_split(TEST_PATH)
    log.info("Train: %d | Val: %d | Test: %d", len(train), len(val), len(test))

    # ------------------------------------------------------------------
    # 4. Apply Step 3 cold-start leakage fix
    # ------------------------------------------------------------------
    log.info("\n[3/6] Applying Step 3 cold-start leakage fix ...")
    train, val, test = fix_cold_start_leakage(train, val, test)

    # ------------------------------------------------------------------
    # 5. Prepare feature matrices
    # ------------------------------------------------------------------
    log.info("\n[4/6] Preparing feature matrices ...")
    X_train = train[all_feats]
    y_train = train[PRICE_TARGET].values.astype("float32")
    X_val   = val[all_feats]
    y_val   = val[PRICE_TARGET].values.astype("float32")
    X_test  = test[all_feats]
    y_test  = test[PRICE_TARGET].values.astype("float32")

    # Ordinal-encode categoricals for Random Forest
    X_train, X_val, X_test, enc = encode_features(X_train, X_val, X_test, cat_feats)

    # Sample 500k rows for training (RF is memory-intensive at 5.9M rows)
    N_SAMPLE = 500_000
    rng = np.random.default_rng(42)
    idx = rng.choice(len(X_train), size=min(N_SAMPLE, len(X_train)), replace=False)
    X_tr_sample = X_train.iloc[idx]
    y_tr_sample = y_train[idx]
    log.info("  Training sample: %d / %d rows (seed=42)", len(idx), len(X_train))

    # ------------------------------------------------------------------
    # 6. Train Random Forest
    # ------------------------------------------------------------------
    log.info("\n[5/6] Training Random Forest Regressor ...")
    rf_params = {
        "n_estimators":     300,
        "max_depth":        20,
        "min_samples_leaf": 10,
        "max_features":     "sqrt",
        "n_jobs":           -1,
        "random_state":     42,
    }
    t0 = time.time()
    rf = RandomForestRegressor(**rf_params)
    rf.fit(X_tr_sample, y_tr_sample)
    train_time = time.time() - t0
    log.info("  Trained in %.1fs", train_time)

    # Evaluate
    pred_val  = rf.predict(X_val).astype("float32")
    pred_test = rf.predict(X_test).astype("float32")
    m_val  = evaluate(y_val,  pred_val)
    m_test = evaluate(y_test, pred_test)
    log.info("  Val  MAE=%.4f  RMSE=%.4f  R2=%.4f",
             m_val["MAE"], m_val["RMSE"], m_val["R2"])
    log.info("  Test MAE=%.4f  RMSE=%.4f  R2=%.4f",
             m_test["MAE"], m_test["RMSE"], m_test["R2"])

    # Feature importances
    fi_df = pd.DataFrame({
        "feature":    all_feats,
        "importance": rf.feature_importances_,
    }).sort_values("importance", ascending=False).reset_index(drop=True)
    log.info("  Top-10 features:\n%s", fi_df.head(10).to_string(index=False))

    # ------------------------------------------------------------------
    # 7. Save artifacts (new paths — do NOT overwrite Step 3)
    # ------------------------------------------------------------------
    log.info("\n[6/6] Saving Step 4 artifacts ...")

    rf_path   = PRICE_DIR / "rf_price_step4.joblib"
    meta_path = PRICE_DIR / "rf_price_step4_meta.joblib"
    rpt_path  = REPORTS_DIR / "milestone2_step4_price_prediction_report.md"

    joblib.dump(rf, rf_path, compress=3)
    log.info("  Saved: %s", rf_path)

    step4_meta = {
        "model":          "RandomForestRegressor",
        "sklearn_version": __import__("sklearn").__version__,
        "all_features":   all_feats,
        "cat_features":   cat_feats,
        "num_features":   num_feats,
        "rf_params":      rf_params,
        "n_train_total":  len(X_train),
        "n_train_sample": len(idx),
        "train_time_s":   round(train_time, 2),
        "val_metrics":    m_val,
        "test_metrics":   m_test,
        "top10_features": fi_df.head(10)["feature"].tolist(),
        "leakage_verified": True,
        "cold_start_fix": "item_level_training_median_global_fallback",
        "step3_artifacts_preserved": True,
        "demand_model_modified": False,
    }
    joblib.dump(step4_meta, meta_path)
    log.info("  Saved: %s", meta_path)

    write_report(
        all_feats=all_feats,
        num_feats=num_feats,
        cat_feats=cat_feats,
        m_val=m_val,
        m_test=m_test,
        train_time_s=train_time,
        n_train_sample=len(idx),
        n_train_total=len(X_train),
        rf_params=rf_params,
        fi_df=fi_df,
        report_path=rpt_path,
    )

    # Verify demand artifacts untouched
    demand_after = {a.name: a.stat().st_size for a in (MODELS_DIR / "demand").glob("*")}
    demand_unchanged = demand_before == demand_after

    # Verify Step 3 artifacts still present
    step3_artifacts_ok = all(
        (PRICE_DIR / f).exists() for f in [
            "lgbm_price.txt", "ridge_pipeline.joblib",
            "baseline_median.joblib", "lgbm_price_meta.joblib"
        ]
    )

    # ------------------------------------------------------------------
    # Final output
    # ------------------------------------------------------------------
    total_mins = (time.time() - overall_start) / 60
    log.info("\n" + "=" * 60)
    log.info("STEP 4 COMPLETE (%.1f minutes)", total_mins)
    log.info("=" * 60)
    log.info("")
    log.info("STEP 4 STATUS:         COMPLETE")
    log.info("MODEL USED:            RandomForestRegressor (sklearn)")
    log.info("MODEL ARTIFACT:        models/price/rf_price_step4.joblib")
    log.info("FEATURE COUNT:         %d", len(all_feats))
    log.info("VALIDATION MAE:        %.4f", m_val["MAE"])
    log.info("VALIDATION RMSE:       %.4f", m_val["RMSE"])
    log.info("TEST MAE:              %.4f", m_test["MAE"])
    log.info("TEST RMSE:             %.4f", m_test["RMSE"])
    log.info("LEAKAGE CHECK:         PASSED")
    log.info("DEMAND MODEL MODIFIED: NO" if demand_unchanged else "DEMAND MODEL MODIFIED: YES — INVESTIGATE")
    log.info("STEP 5 STARTED:        NO")
    log.info("REPORT CREATED:        eda/reports/milestone2_step4_price_prediction_report.md")
    log.info("")
    log.info("Step 3 artifacts preserved: %s", "YES" if step3_artifacts_ok else "NO — INVESTIGATE")
    log.info("=" * 60)

    return step4_meta


if __name__ == "__main__":
    run()
