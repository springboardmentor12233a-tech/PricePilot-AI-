"""
PricePilot AI - Milestone 2 Step 3: Model Development
======================================================
Trains, validates, and evaluates models for:
  1. Price Prediction  (target: price_base)
  2. Demand Forecasting (target: quantity)

Uses chronological train/val/test splits from Step 2.
No random splitting. No target leakage. No data duplication.

Outputs:
  - models/price/  trained price models + preprocessor
  - models/demand/ trained demand models + preprocessor
  - eda/reports/milestone2_step3_model_development_report.md
  - eda/reports/model_comparison_results.csv
"""

import sys
import time
import logging
import warnings
import gc
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.linear_model import Ridge
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

import lightgbm as lgb

warnings.filterwarnings("ignore")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
PROCESSED  = ROOT / "Datasets" / "processed"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "eda" / "reports"

TRAIN_PATH = PROCESSED / "train_data.csv.gz"
VAL_PATH   = PROCESSED / "val_data.csv.gz"
TEST_PATH  = PROCESSED / "test_data.csv.gz"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
(MODELS_DIR / "price").mkdir(parents=True, exist_ok=True)
(MODELS_DIR / "demand").mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Feature configuration (from Step 2 leakage audit)
# ---------------------------------------------------------------------------
EXCLUDED_ALWAYS = ["date", "item_id", "sum_total"]

# Price Prediction: exclude quantity (contemporaneous demand outcome)
PRICE_EXCLUDE  = EXCLUDED_ALWAYS + ["quantity", "price_base"]
# Demand Forecasting: price_base IS a valid input feature
DEMAND_EXCLUDE = EXCLUDED_ALWAYS + ["quantity"]

CAT_COLS = [
    "dept_name", "class_name", "subclass_name", "item_type",
    "division", "format", "city", "promo_type_code",
]


def get_feature_cols(df, exclude):
    all_cols  = set(df.columns)
    excluded  = set(exclude)
    remaining = all_cols - excluded
    cat_feats = [c for c in CAT_COLS if c in remaining]
    num_feats = sorted([c for c in remaining if c not in cat_feats])
    cat_feats = sorted(cat_feats)
    return num_feats, cat_feats


# ---------------------------------------------------------------------------
# Metric helpers
# ---------------------------------------------------------------------------
def smape(y_true, y_pred):
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    mask  = denom > 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(np.abs(y_true[mask] - y_pred[mask]) / denom[mask]) * 100)


def mape(y_true, y_pred, eps=1e-6):
    return float(np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + eps))) * 100)


def evaluate(y_true, y_pred, task="price"):
    mae  = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2   = float(r2_score(y_true, y_pred))
    metrics = {"MAE": mae, "RMSE": rmse, "R2": r2}
    if task == "demand":
        metrics["SMAPE"] = smape(y_true, y_pred)
        metrics["MAPE"]  = mape(y_true, y_pred)
    return metrics


# ---------------------------------------------------------------------------
# Data loading - memory-efficient dtype casting
# ---------------------------------------------------------------------------
DTYPE_MAP = {
    "store_id": "int8", "year": "int16", "month": "int8",
    "day_of_month": "int8", "day_of_week": "int8", "week_of_year": "int8",
    "quarter": "int8", "day_of_year": "int16", "is_weekend": "int8",
    "is_month_start": "int8", "is_month_end": "int8",
    "number_disc_day": "int16", "promo_doc_count": "int8",
    "is_on_promo": "int8", "has_online_listing": "int8",
    "is_new_item_store": "int8",
}


def load_split(path, nrows=None):
    log.info("Loading %s ...", path.name)
    t0 = time.time()
    df = pd.read_csv(path, dtype=DTYPE_MAP, nrows=nrows, low_memory=False)
    for c in CAT_COLS:
        if c in df.columns:
            df[c] = df[c].astype("category")
    float_cols = df.select_dtypes("float64").columns
    df[float_cols] = df[float_cols].astype("float32")
    log.info("  -> %d rows, %d cols in %.1fs", len(df), df.shape[1], time.time() - t0)
    return df


# ---------------------------------------------------------------------------
# Preprocessor for Ridge (OrdinalEncoder + StandardScaler)
# ---------------------------------------------------------------------------
def build_preprocessor(num_feats, cat_feats):
    num_pipe = Pipeline([("scaler", StandardScaler())])
    cat_pipe = Pipeline([
        ("ordinal", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1))
    ])
    return ColumnTransformer([
        ("num", num_pipe, num_feats),
        ("cat", cat_pipe, cat_feats),
    ], remainder="drop", n_jobs=1)


# ---------------------------------------------------------------------------
# LightGBM training helper
# ---------------------------------------------------------------------------
LGB_PARAMS_BASE = {
    "objective":         "regression",
    "metric":            ["mae", "rmse"],
    "boosting_type":     "gbdt",
    "num_leaves":        255,
    "learning_rate":     0.05,
    "feature_fraction":  0.8,
    "bagging_fraction":  0.8,
    "bagging_freq":      5,
    "min_child_samples": 30,
    "n_jobs":            -1,
    "seed":              42,
    "verbose":           -1,
}


def train_lgbm(X_train, y_train, X_val, y_val, cat_features, params,
               n_estimators=2000, early_stopping_rounds=50):
    dtrain = lgb.Dataset(
        X_train, label=y_train,
        categorical_feature=cat_features,
        free_raw_data=True
    )
    dval = lgb.Dataset(
        X_val, label=y_val,
        categorical_feature=cat_features,
        free_raw_data=True,
        reference=dtrain
    )
    callbacks = [
        lgb.early_stopping(stopping_rounds=early_stopping_rounds, verbose=True),
        lgb.log_evaluation(period=100),
    ]
    booster = lgb.train(
        params, dtrain,
        num_boost_round=n_estimators,
        valid_sets=[dtrain, dval],
        valid_names=["train", "val"],
        callbacks=callbacks,
    )
    return booster


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run():
    overall_start = time.time()
    results = []

    # -----------------------------------------------------------------------
    # Load splits
    # -----------------------------------------------------------------------
    log.info("=" * 60)
    log.info("Loading train / val / test splits ...")
    log.info("=" * 60)
    train = load_split(TRAIN_PATH)
    val   = load_split(VAL_PATH)
    test  = load_split(TEST_PATH)

    log.info("Train: %d rows | Val: %d rows | Test: %d rows",
             len(train), len(val), len(test))
    log.info("Train: %s to %s", train["date"].min(), train["date"].max())
    log.info("Val  : %s to %s", val["date"].min(),   val["date"].max())
    log.info("Test : %s to %s", test["date"].min(),  test["date"].max())

    # =======================================================================
    # TASK 1: PRICE PREDICTION
    # =======================================================================
    log.info("\n" + "=" * 60)
    log.info("TASK 1: PRICE PREDICTION  (target=price_base)")
    log.info("=" * 60)

    PRICE_TARGET = "price_base"
    num_feats_p, cat_feats_p = get_feature_cols(train, PRICE_EXCLUDE)
    all_feats_p = num_feats_p + cat_feats_p

    log.info("Price features: %d total (%d numeric, %d categorical)",
             len(all_feats_p), len(num_feats_p), len(cat_feats_p))
    log.info("Categorical: %s", cat_feats_p)

    X_train_p = train[all_feats_p]
    y_train_p = train[PRICE_TARGET].values.astype("float32")
    X_val_p   = val[all_feats_p]
    y_val_p   = val[PRICE_TARGET].values.astype("float32")
    X_test_p  = test[all_feats_p]
    y_test_p  = test[PRICE_TARGET].values.astype("float32")

    # ---- P1: Baseline (item-store median) ----------------------------------
    log.info("\n[Price P1] Baseline: item-store median price ...")
    t0 = time.time()

    price_med_map = (
        train.groupby(["item_id", "store_id"])[PRICE_TARGET]
        .median().reset_index()
        .rename(columns={PRICE_TARGET: "pred_price"})
    )
    global_price_med = float(train[PRICE_TARGET].median())

    def predict_price_baseline(df):
        merged = df[["item_id", "store_id"]].merge(
            price_med_map, on=["item_id", "store_id"], how="left")
        return merged["pred_price"].fillna(global_price_med).values.astype("float32")

    t_baseline_p = time.time() - t0
    m_val_bp  = evaluate(y_val_p,  predict_price_baseline(val),  task="price")
    m_test_bp = evaluate(y_test_p, predict_price_baseline(test), task="price")
    log.info("  Val  MAE=%.4f RMSE=%.4f R2=%.4f", m_val_bp["MAE"], m_val_bp["RMSE"], m_val_bp["R2"])
    log.info("  Test MAE=%.4f RMSE=%.4f R2=%.4f", m_test_bp["MAE"], m_test_bp["RMSE"], m_test_bp["R2"])
    results += [
        {"task": "price", "model": "Baseline_MedianPrice", "split": "val",  **m_val_bp,  "train_time_s": t_baseline_p},
        {"task": "price", "model": "Baseline_MedianPrice", "split": "test", **m_test_bp, "train_time_s": t_baseline_p},
    ]
    joblib.dump({"map": price_med_map, "global_median": global_price_med},
                MODELS_DIR / "price" / "baseline_median.joblib")

    # ---- P2: Ridge ---------------------------------------------------------
    log.info("\n[Price P2] Ridge Regression (500k sample) ...")
    t0 = time.time()
    prep_p = build_preprocessor(num_feats_p, cat_feats_p)
    ridge_p = Pipeline([("prep", prep_p), ("ridge", Ridge(alpha=10.0))])
    RIDGE_N = 500_000
    rng = np.random.default_rng(42)
    idx_p = rng.choice(len(X_train_p), size=min(RIDGE_N, len(X_train_p)), replace=False)
    ridge_p.fit(X_train_p.iloc[idx_p], y_train_p[idx_p])
    t_ridge_p = time.time() - t0
    log.info("  Trained on %d rows in %.1fs", len(idx_p), t_ridge_p)

    pred_val_ridge_p  = ridge_p.predict(X_val_p).astype("float32")
    pred_test_ridge_p = ridge_p.predict(X_test_p).astype("float32")
    m_val_rp  = evaluate(y_val_p,  pred_val_ridge_p,  task="price")
    m_test_rp = evaluate(y_test_p, pred_test_ridge_p, task="price")
    log.info("  Val  MAE=%.4f RMSE=%.4f R2=%.4f", m_val_rp["MAE"], m_val_rp["RMSE"], m_val_rp["R2"])
    log.info("  Test MAE=%.4f RMSE=%.4f R2=%.4f", m_test_rp["MAE"], m_test_rp["RMSE"], m_test_rp["R2"])
    results += [
        {"task": "price", "model": "Ridge", "split": "val",  **m_val_rp,  "train_time_s": t_ridge_p},
        {"task": "price", "model": "Ridge", "split": "test", **m_test_rp, "train_time_s": t_ridge_p},
    ]
    joblib.dump(ridge_p, MODELS_DIR / "price" / "ridge_pipeline.joblib")
    del prep_p
    gc.collect()

    # ---- P3: LightGBM ------------------------------------------------------
    log.info("\n[Price P3] LightGBM GBDT (full train set) ...")
    t0 = time.time()
    params_p = dict(LGB_PARAMS_BASE)
    params_p["objective"] = "regression"
    lgbm_p = train_lgbm(
        X_train_p, y_train_p, X_val_p, y_val_p,
        cat_features=cat_feats_p, params=params_p,
        n_estimators=2000, early_stopping_rounds=50,
    )
    t_lgbm_p = time.time() - t0
    log.info("  Trained in %.1fs, best_iteration=%d", t_lgbm_p, lgbm_p.best_iteration)

    pred_val_lgbm_p  = lgbm_p.predict(X_val_p,  num_iteration=lgbm_p.best_iteration).astype("float32")
    pred_test_lgbm_p = lgbm_p.predict(X_test_p, num_iteration=lgbm_p.best_iteration).astype("float32")
    m_val_lp  = evaluate(y_val_p,  pred_val_lgbm_p,  task="price")
    m_test_lp = evaluate(y_test_p, pred_test_lgbm_p, task="price")
    log.info("  Val  MAE=%.4f RMSE=%.4f R2=%.4f", m_val_lp["MAE"], m_val_lp["RMSE"], m_val_lp["R2"])
    log.info("  Test MAE=%.4f RMSE=%.4f R2=%.4f", m_test_lp["MAE"], m_test_lp["RMSE"], m_test_lp["R2"])
    results += [
        {"task": "price", "model": "LightGBM", "split": "val",  **m_val_lp,  "train_time_s": t_lgbm_p},
        {"task": "price", "model": "LightGBM", "split": "test", **m_test_lp, "train_time_s": t_lgbm_p},
    ]

    fi_price = pd.DataFrame({
        "feature":          lgbm_p.feature_name(),
        "importance_gain":  lgbm_p.feature_importance(importance_type="gain"),
        "importance_split": lgbm_p.feature_importance(importance_type="split"),
    }).sort_values("importance_gain", ascending=False)
    fi_price.to_csv(REPORTS_DIR / "price_feature_importance.csv", index=False)
    log.info("  Top-10 features:\n%s", fi_price.head(10).to_string(index=False))

    lgbm_p.save_model(str(MODELS_DIR / "price" / "lgbm_price.txt"))
    joblib.dump({"cat_features": cat_feats_p, "all_features": all_feats_p},
                MODELS_DIR / "price" / "lgbm_price_meta.joblib")

    # ---- Best price model --------------------------------------------------
    price_val_mae = {
        "Baseline_MedianPrice": m_val_bp["MAE"],
        "Ridge":                m_val_rp["MAE"],
        "LightGBM":             m_val_lp["MAE"],
    }
    best_price_model = min(price_val_mae, key=lambda k: price_val_mae[k])
    log.info("\n[Price] BEST model by val MAE: %s (MAE=%.4f)",
             best_price_model, price_val_mae[best_price_model])

    del X_train_p, y_train_p, X_val_p, y_val_p, X_test_p, y_test_p
    gc.collect()

    # =======================================================================
    # TASK 2: DEMAND FORECASTING
    # =======================================================================
    log.info("\n" + "=" * 60)
    log.info("TASK 2: DEMAND FORECASTING  (target=quantity)")
    log.info("=" * 60)

    DEMAND_TARGET = "quantity"
    num_feats_d, cat_feats_d = get_feature_cols(train, DEMAND_EXCLUDE)
    all_feats_d = num_feats_d + cat_feats_d

    log.info("Demand features: %d total (%d numeric, %d categorical)",
             len(all_feats_d), len(num_feats_d), len(cat_feats_d))

    X_train_d = train[all_feats_d]
    y_train_d = train[DEMAND_TARGET].values.astype("float32")
    X_val_d   = val[all_feats_d]
    y_val_d   = val[DEMAND_TARGET].values.astype("float32")
    X_test_d  = test[all_feats_d]
    y_test_d  = test[DEMAND_TARGET].values.astype("float32")

    # ---- D1: Baseline (item-store mean) ------------------------------------
    log.info("\n[Demand D1] Baseline: item-store mean demand ...")
    t0 = time.time()

    demand_mean_map = (
        train.groupby(["item_id", "store_id"])[DEMAND_TARGET]
        .mean().reset_index()
        .rename(columns={DEMAND_TARGET: "pred_qty"})
    )
    global_demand_mean = float(train[DEMAND_TARGET].mean())

    def predict_demand_baseline(df):
        merged = df[["item_id", "store_id"]].merge(
            demand_mean_map, on=["item_id", "store_id"], how="left")
        return merged["pred_qty"].fillna(global_demand_mean).values.astype("float32")

    t_baseline_d = time.time() - t0
    m_val_bd  = evaluate(y_val_d,  predict_demand_baseline(val),  task="demand")
    m_test_bd = evaluate(y_test_d, predict_demand_baseline(test), task="demand")
    log.info("  Val  MAE=%.4f RMSE=%.4f SMAPE=%.2f%%",
             m_val_bd["MAE"], m_val_bd["RMSE"], m_val_bd["SMAPE"])
    log.info("  Test MAE=%.4f RMSE=%.4f SMAPE=%.2f%%",
             m_test_bd["MAE"], m_test_bd["RMSE"], m_test_bd["SMAPE"])
    results += [
        {"task": "demand", "model": "Baseline_MeanDemand", "split": "val",  **m_val_bd,  "train_time_s": t_baseline_d},
        {"task": "demand", "model": "Baseline_MeanDemand", "split": "test", **m_test_bd, "train_time_s": t_baseline_d},
    ]
    joblib.dump({"map": demand_mean_map, "global_mean": global_demand_mean},
                MODELS_DIR / "demand" / "baseline_mean.joblib")

    # ---- D2: Ridge ---------------------------------------------------------
    log.info("\n[Demand D2] Ridge Regression (500k sample) ...")
    t0 = time.time()
    prep_d  = build_preprocessor(num_feats_d, cat_feats_d)
    ridge_d = Pipeline([("prep", prep_d), ("ridge", Ridge(alpha=10.0))])
    idx_d = rng.choice(len(X_train_d), size=min(RIDGE_N, len(X_train_d)), replace=False)
    ridge_d.fit(X_train_d.iloc[idx_d], y_train_d[idx_d])
    t_ridge_d = time.time() - t0
    log.info("  Trained on %d rows in %.1fs", len(idx_d), t_ridge_d)

    pred_val_ridge_d  = ridge_d.predict(X_val_d).astype("float32")
    pred_test_ridge_d = ridge_d.predict(X_test_d).astype("float32")
    m_val_rd  = evaluate(y_val_d,  pred_val_ridge_d,  task="demand")
    m_test_rd = evaluate(y_test_d, pred_test_ridge_d, task="demand")
    log.info("  Val  MAE=%.4f RMSE=%.4f SMAPE=%.2f%%",
             m_val_rd["MAE"], m_val_rd["RMSE"], m_val_rd["SMAPE"])
    log.info("  Test MAE=%.4f RMSE=%.4f SMAPE=%.2f%%",
             m_test_rd["MAE"], m_test_rd["RMSE"], m_test_rd["SMAPE"])
    results += [
        {"task": "demand", "model": "Ridge", "split": "val",  **m_val_rd,  "train_time_s": t_ridge_d},
        {"task": "demand", "model": "Ridge", "split": "test", **m_test_rd, "train_time_s": t_ridge_d},
    ]
    joblib.dump(ridge_d, MODELS_DIR / "demand" / "ridge_pipeline.joblib")
    del prep_d
    gc.collect()

    # ---- D3: LightGBM ------------------------------------------------------
    log.info("\n[Demand D3] LightGBM GBDT - MAE objective (full train set) ...")
    t0 = time.time()
    params_d = dict(LGB_PARAMS_BASE)
    params_d["objective"] = "regression_l1"   # direct MAE optimization
    params_d["metric"]    = ["mae", "rmse"]
    lgbm_d = train_lgbm(
        X_train_d, y_train_d, X_val_d, y_val_d,
        cat_features=cat_feats_d, params=params_d,
        n_estimators=2000, early_stopping_rounds=50,
    )
    t_lgbm_d = time.time() - t0
    log.info("  Trained in %.1fs, best_iteration=%d", t_lgbm_d, lgbm_d.best_iteration)

    pred_val_lgbm_d  = lgbm_d.predict(X_val_d,  num_iteration=lgbm_d.best_iteration).astype("float32")
    pred_test_lgbm_d = lgbm_d.predict(X_test_d, num_iteration=lgbm_d.best_iteration).astype("float32")
    m_val_ld  = evaluate(y_val_d,  pred_val_lgbm_d,  task="demand")
    m_test_ld = evaluate(y_test_d, pred_test_lgbm_d, task="demand")
    log.info("  Val  MAE=%.4f RMSE=%.4f SMAPE=%.2f%%",
             m_val_ld["MAE"], m_val_ld["RMSE"], m_val_ld["SMAPE"])
    log.info("  Test MAE=%.4f RMSE=%.4f SMAPE=%.2f%%",
             m_test_ld["MAE"], m_test_ld["RMSE"], m_test_ld["SMAPE"])
    results += [
        {"task": "demand", "model": "LightGBM", "split": "val",  **m_val_ld,  "train_time_s": t_lgbm_d},
        {"task": "demand", "model": "LightGBM", "split": "test", **m_test_ld, "train_time_s": t_lgbm_d},
    ]

    fi_demand = pd.DataFrame({
        "feature":          lgbm_d.feature_name(),
        "importance_gain":  lgbm_d.feature_importance(importance_type="gain"),
        "importance_split": lgbm_d.feature_importance(importance_type="split"),
    }).sort_values("importance_gain", ascending=False)
    fi_demand.to_csv(REPORTS_DIR / "demand_feature_importance.csv", index=False)
    log.info("  Top-10 features:\n%s", fi_demand.head(10).to_string(index=False))

    lgbm_d.save_model(str(MODELS_DIR / "demand" / "lgbm_demand.txt"))
    joblib.dump({"cat_features": cat_feats_d, "all_features": all_feats_d},
                MODELS_DIR / "demand" / "lgbm_demand_meta.joblib")

    # ---- Best demand model -------------------------------------------------
    demand_val_mae = {
        "Baseline_MeanDemand": m_val_bd["MAE"],
        "Ridge":               m_val_rd["MAE"],
        "LightGBM":            m_val_ld["MAE"],
    }
    best_demand_model = min(demand_val_mae, key=lambda k: demand_val_mae[k])
    log.info("\n[Demand] BEST model by val MAE: %s (MAE=%.4f)",
             best_demand_model, demand_val_mae[best_demand_model])

    del X_train_d, y_train_d, X_val_d, y_val_d, X_test_d, y_test_d
    gc.collect()

    # =======================================================================
    # Save comparison CSV + metadata JSON
    # =======================================================================
    results_df = pd.DataFrame(results)
    for col in ["MAE", "RMSE", "R2", "SMAPE", "MAPE"]:
        if col in results_df.columns:
            results_df[col] = results_df[col].round(6)
    results_df["train_time_s"] = results_df["train_time_s"].round(2)
    results_df.to_csv(REPORTS_DIR / "model_comparison_results.csv", index=False)
    log.info("Saved: %s", REPORTS_DIR / "model_comparison_results.csv")

    meta = {
        "best_price_model":  best_price_model,
        "best_demand_model": best_demand_model,
        "price_models": {
            "Baseline_MedianPrice": {
                "val": m_val_bp, "test": m_test_bp, "train_time_s": round(t_baseline_p, 2)
            },
            "Ridge": {
                "val": m_val_rp, "test": m_test_rp, "train_time_s": round(t_ridge_p, 2),
                "hyperparams": {"alpha": 10.0, "sample_size": int(RIDGE_N)}
            },
            "LightGBM": {
                "val": m_val_lp, "test": m_test_lp, "train_time_s": round(t_lgbm_p, 2),
                "best_iteration": int(lgbm_p.best_iteration),
                "hyperparams": {k: v for k, v in params_p.items() if k != "metric"}
            },
        },
        "demand_models": {
            "Baseline_MeanDemand": {
                "val": m_val_bd, "test": m_test_bd, "train_time_s": round(t_baseline_d, 2)
            },
            "Ridge": {
                "val": m_val_rd, "test": m_test_rd, "train_time_s": round(t_ridge_d, 2),
                "hyperparams": {"alpha": 10.0, "sample_size": int(RIDGE_N)}
            },
            "LightGBM": {
                "val": m_val_ld, "test": m_test_ld, "train_time_s": round(t_lgbm_d, 2),
                "best_iteration": int(lgbm_d.best_iteration),
                "hyperparams": {k: v for k, v in params_d.items() if k != "metric"}
            },
        },
        "price_features":   {"numeric": num_feats_p, "categorical": cat_feats_p},
        "demand_features":  {"numeric": num_feats_d, "categorical": cat_feats_d},
        "price_top10":  fi_price.head(10)["feature"].tolist(),
        "demand_top10": fi_demand.head(10)["feature"].tolist(),
        "total_runtime_s": round(time.time() - overall_start, 1),
    }
    with open(REPORTS_DIR / "step3_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    log.info("Saved: %s", REPORTS_DIR / "step3_meta.json")

    total_mins = (time.time() - overall_start) / 60
    log.info("\n" + "=" * 60)
    log.info("MILESTONE 2 STEP 3 COMPLETE in %.1f minutes", total_mins)
    log.info("  PRICE PREDICTION   -- BEST MODEL: %s", best_price_model)
    log.info("  DEMAND FORECASTING -- BEST MODEL: %s", best_demand_model)
    log.info("=" * 60)
    return meta


if __name__ == "__main__":
    run()
