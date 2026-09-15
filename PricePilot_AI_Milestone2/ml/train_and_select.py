"""
PricePilot AI — Milestone 2
Model Training & Selection Pipeline with GridSearchCV
======================================================
Models evaluated:
  1. Ridge Regression (baseline)
  2. Random Forest Regressor
  3. XGBoost Regressor
  4. LightGBM Regressor (if available)

Best model selected by R² on held-out test set and saved with joblib.
"""

import os, sys, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

warnings.filterwarnings("ignore")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ─── Paths ─────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_PATH    = os.path.join(BASE_DIR, "..", "data", "processed", "integrated_pricing_demand_dataset.csv")
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")
PLOT_DIR     = os.path.join(BASE_DIR, "plots")
os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs(PLOT_DIR, exist_ok=True)

print("=" * 60)
print("  PricePilot AI - Milestone 2: ML Training Pipeline")
print("=" * 60)

# ─── 1. Load Dataset ───────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
print(f"\n[OK] Dataset loaded: {df.shape[0]} rows x {df.shape[1]} cols")
print(f"     Columns: {list(df.columns)}")

# ─── 2. Feature Engineering ────────────────────────────────────────
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["quarter"]       = df["date"].dt.quarter
df["price_to_c1"]   = df["current_price"] / df["competitor_1_price"].clip(lower=1)
df["price_to_c2"]   = df["current_price"] / df["competitor_2_price"].clip(lower=1)
df["price_to_c3"]   = df["current_price"] / df["competitor_3_price"].clip(lower=1)
df["margin_pct"]    = (df["current_price"] - df["cost_price"]) / df["current_price"].clip(lower=0.01)
df["discount_depth"]= (df["base_msrp"]   - df["current_price"]) / df["base_msrp"].clip(lower=0.01)
df["log_price"]     = np.log1p(df["current_price"])

le_cat  = LabelEncoder()
le_chan  = LabelEncoder()
le_dow  = LabelEncoder()
df["category_enc"]    = le_cat.fit_transform(df["category"].astype(str))
df["channel_enc"]     = le_chan.fit_transform(df["sales_channel"].astype(str))
df["day_of_week_enc"] = le_dow.fit_transform(df["day_of_week"].astype(str))

print(f"[OK] Feature engineering complete")

# ─── 3. Feature Lists ──────────────────────────────────────────────
PRICE_FEATURES = [
    "cost_price", "base_msrp", "competitor_1_price", "competitor_2_price",
    "competitor_3_price", "comp_avg_price", "price_to_c1", "margin_pct",
    "discount_depth", "category_enc", "channel_enc", "stock_level",
    "product_rating", "is_promotion", "is_holiday", "month", "quarter",
    "is_weekend", "units_sold", "log_price",
]
DEMAND_FEATURES = [
    "current_price", "log_price", "cost_price", "base_msrp",
    "competitor_1_price", "competitor_2_price", "competitor_3_price",
    "price_to_c1", "price_diff_vs_comp_avg", "margin_pct", "discount_depth",
    'category_enc', 'channel_enc', 'stock_level', 'product_rating',
    'is_promotion', 'is_holiday', 'month', 'quarter', 'day_of_week_enc', 'is_weekend',
]

df = df.dropna(subset=PRICE_FEATURES + DEMAND_FEATURES + ["current_price", "units_sold"])
X_price  = df[PRICE_FEATURES].fillna(0)
y_price  = df["current_price"]
X_demand = df[DEMAND_FEATURES].fillna(0)
y_demand = df["units_sold"]

print(f"[OK] Training samples: {len(X_price)}")
print(f"     Price features: {len(PRICE_FEATURES)}  |  Demand features: {len(DEMAND_FEATURES)}")

# ─── 4. GridSearchCV Engine ────────────────────────────────────────
def run_gridsearch(X, y, target_name):
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_tr_sc = scaler.fit_transform(X_tr)
    X_te_sc = scaler.transform(X_te)

    print(f"\n{'─'*60}")
    print(f"  GridSearchCV: Target = '{target_name}'")
    print(f"  Train: {len(X_tr)} | Test: {len(X_te)}")
    print(f"{'─'*60}")

    candidates = {
        "Ridge (Baseline)": {
            "model":  Ridge(),
            "params": {"alpha": [0.1, 1.0, 10.0, 100.0]},
            "scale":  True,
        },
        "Random Forest": {
            "model":  RandomForestRegressor(random_state=42, n_jobs=-1),
            "params": {
                "n_estimators": [200, 400],
                "max_depth":    [None, 10, 20],
                "min_samples_split": [2, 5],
                "max_features": ["sqrt", "log2"],
            },
            "scale": False,
        },
        "XGBoost": {
            "model":  xgb.XGBRegressor(
                objective="reg:squarederror", random_state=42, verbosity=0
            ),
            "params": {
                "n_estimators":    [200, 400],
                "max_depth":       [4, 6],
                "learning_rate":   [0.05, 0.1],
                "subsample":       [0.8, 1.0],
                "colsample_bytree":[0.8, 1.0],
            },
            "scale": False,
        },
    }
    if HAS_LGB:
        candidates["LightGBM"] = {
            "model":  lgb.LGBMRegressor(random_state=42, verbosity=-1),
            "params": {
                "n_estimators": [200, 400],
                "max_depth":    [-1, 6],
                "learning_rate":[0.05, 0.1],
                "num_leaves":   [31, 63],
            },
            "scale": False,
        }

    results, best = [], {"name": None, "model": None, "r2": -np.inf, "scaler": None, "scale": False}

    for name, cfg in candidates.items():
        Xf = X_tr_sc if cfg["scale"] else X_tr.values
        Xe = X_te_sc  if cfg["scale"] else X_te.values
        print(f"  >> GridSearchCV: {name} ...")
        gs = GridSearchCV(cfg["model"], cfg["params"], cv=3, scoring="r2", n_jobs=-1, verbose=0)
        gs.fit(Xf, y_tr)
        y_pred = gs.best_estimator_.predict(Xe)
        mae  = mean_absolute_error(y_te, y_pred)
        rmse = np.sqrt(mean_squared_error(y_te, y_pred))
        r2   = r2_score(y_te, y_pred)
        print(f"     {name}: CV-R2={gs.best_score_:.4f}  Test-R2={r2:.4f}  MAE={mae:.2f}  RMSE={rmse:.2f}")
        print(f"     Best params: {gs.best_params_}")
        results.append({"model": name, "cv_r2": round(gs.best_score_,4),
                        "test_r2": round(r2,4), "mae": round(mae,4), "rmse": round(rmse,4),
                        "best_params": str(gs.best_params_)})
        if r2 > best["r2"]:
            best = {"name": name, "model": gs.best_estimator_, "r2": r2,
                    "scaler": scaler if cfg["scale"] else None, "scale": cfg["scale"]}

    df_res = pd.DataFrame(results).sort_values("test_r2", ascending=False)
    print(f"\n  *** WINNER for '{target_name}': {best['name']} (Test R2={best['r2']:.4f}) ***")
    print(df_res[["model","cv_r2","test_r2","mae","rmse"]].to_string(index=False))
    return best, df_res, X_tr, X_te, y_tr, y_te

# ─── 5. Train Both Models ──────────────────────────────────────────
best_price,  price_res,  Xptr, Xpte, yptr, ypte = run_gridsearch(X_price,  y_price,  "current_price")
best_demand, demand_res, Xdtr, Xdte, ydtr, ydte = run_gridsearch(X_demand, y_demand, "units_sold")

# ─── 6. Save Artifacts ─────────────────────────────────────────────
print("\n[SAVING] Model artifacts...")
joblib.dump({
    "model": best_price["model"], "scaler": best_price["scaler"],
    "features": PRICE_FEATURES, "model_name": best_price["name"],
    "test_r2": best_price["r2"], "le_category": le_cat, "le_channel": le_chan,
}, os.path.join(ARTIFACT_DIR, "price_model.pkl"))

joblib.dump({
    "model": best_demand["model"], "scaler": best_demand["scaler"],
    "features": DEMAND_FEATURES, "model_name": best_demand["name"],
    "test_r2": best_demand["r2"], "le_category": le_cat, "le_channel": le_chan,
}, os.path.join(ARTIFACT_DIR, "demand_model.pkl"))

price_res.to_csv(os.path.join(ARTIFACT_DIR, "price_model_comparison.csv"), index=False)
demand_res.to_csv(os.path.join(ARTIFACT_DIR, "demand_model_comparison.csv"), index=False)
print("[OK] Artifacts saved to: artifacts/")

# ─── 7. Evaluation Plots ───────────────────────────────────────────
print("[PLOTTING] Generating evaluation charts...")
plt.style.use("dark_background")
COLORS = ["#6366f1","#10b981","#f59e0b","#ec4899"]

# Plot 1: Model comparison bar chart
fig, axes = plt.subplots(1, 2, figsize=(18, 6))
fig.suptitle("PricePilot AI - Milestone 2: GridSearchCV Model Comparison",
             fontsize=15, fontweight="bold", color="white")
for ax, (df_r, label) in zip(axes, [(price_res,"Price Prediction R2"), (demand_res,"Demand Forecasting R2")]):
    bars = ax.barh(df_r["model"], df_r["test_r2"], color=COLORS[:len(df_r)], edgecolor="white", linewidth=0.5)
    ax.set_xlabel("Test R2 Score", color="white"); ax.set_title(label, color="white", fontweight="bold")
    ax.tick_params(colors="white"); ax.set_facecolor("#1e293b")
    for spine in ax.spines.values(): spine.set_color("#334155")
    for bar, val in zip(bars, df_r["test_r2"]):
        ax.text(bar.get_width()+0.005, bar.get_y()+bar.get_height()/2, f"{val:.4f}", va="center", color="white", fontsize=10)
    ax.set_xlim(0, 1.1)
fig.patch.set_facecolor("#0f172a")
plt.tight_layout(); plt.savefig(os.path.join(PLOT_DIR,"01_model_comparison.png"), dpi=150, bbox_inches="tight", facecolor="#0f172a"); plt.close()

# Plot 2: Actual vs Predicted — Price
Xp_inp = Xpte.values if not best_price["scale"] else best_price["scaler"].transform(Xpte)
yp_pred = best_price["model"].predict(Xp_inp)
fig, ax = plt.subplots(figsize=(9,7))
ax.scatter(ypte, yp_pred, alpha=0.4, s=12, c="#6366f1", edgecolors="none")
lim = [min(float(ypte.min()),float(yp_pred.min())), max(float(ypte.max()),float(yp_pred.max()))]
ax.plot(lim, lim, "r--", lw=2)
ax.set_xlabel("Actual Price ($)", color="white"); ax.set_ylabel("Predicted Price ($)", color="white")
ax.set_title(f"Actual vs Predicted Price ({best_price['name']})  R2={best_price['r2']:.4f}", color="white", fontweight="bold")
ax.set_facecolor("#1e293b"); ax.tick_params(colors="white")
for sp in ax.spines.values(): sp.set_color("#334155")
fig.patch.set_facecolor("#0f172a")
plt.tight_layout(); plt.savefig(os.path.join(PLOT_DIR,"02_actual_vs_predicted_price.png"), dpi=150, bbox_inches="tight", facecolor="#0f172a"); plt.close()

# Plot 3: Actual vs Predicted — Demand
Xd_inp = Xdte.values if not best_demand["scale"] else best_demand["scaler"].transform(Xdte)
yd_pred = best_demand["model"].predict(Xd_inp)
fig, ax = plt.subplots(figsize=(9,7))
ax.scatter(ydte, yd_pred, alpha=0.4, s=12, c="#10b981", edgecolors="none")
lim_d = [min(float(ydte.min()),float(yd_pred.min())), max(float(ydte.max()),float(yd_pred.max()))]
ax.plot(lim_d, lim_d, "r--", lw=2)
ax.set_xlabel("Actual Units Sold", color="white"); ax.set_ylabel("Predicted Units Sold", color="white")
ax.set_title(f"Actual vs Predicted Demand ({best_demand['name']})  R2={best_demand['r2']:.4f}", color="white", fontweight="bold")
ax.set_facecolor("#1e293b"); ax.tick_params(colors="white")
for sp in ax.spines.values(): sp.set_color("#334155")
fig.patch.set_facecolor("#0f172a")
plt.tight_layout(); plt.savefig(os.path.join(PLOT_DIR,"03_actual_vs_predicted_demand.png"), dpi=150, bbox_inches="tight", facecolor="#0f172a"); plt.close()

# Plot 4: Feature Importance — Price Model
if hasattr(best_price["model"], "feature_importances_"):
    fi = pd.DataFrame({"feature": PRICE_FEATURES, "importance": best_price["model"].feature_importances_}).sort_values("importance", ascending=True).tail(15)
    fig, ax = plt.subplots(figsize=(11,7))
    clrs = plt.cm.plasma(np.linspace(0.2,0.9,len(fi)))
    ax.barh(fi["feature"], fi["importance"], color=clrs, edgecolor="none")
    ax.set_xlabel("Importance", color="white"); ax.set_title(f"Top Features - Price Model ({best_price['name']})", color="white", fontweight="bold")
    ax.set_facecolor("#1e293b"); ax.tick_params(colors="white")
    for sp in ax.spines.values(): sp.set_color("#334155")
    fig.patch.set_facecolor("#0f172a")
    plt.tight_layout(); plt.savefig(os.path.join(PLOT_DIR,"04_feature_importance_price.png"), dpi=150, bbox_inches="tight", facecolor="#0f172a"); plt.close()

# Plot 5: Feature Importance — Demand Model
if hasattr(best_demand["model"], "feature_importances_"):
    fi2 = pd.DataFrame({"feature": DEMAND_FEATURES, "importance": best_demand["model"].feature_importances_}).sort_values("importance", ascending=True).tail(15)
    fig, ax = plt.subplots(figsize=(11,7))
    clrs2 = plt.cm.viridis(np.linspace(0.2,0.9,len(fi2)))
    ax.barh(fi2["feature"], fi2["importance"], color=clrs2, edgecolor="none")
    ax.set_xlabel("Importance", color="white"); ax.set_title(f"Top Features - Demand Model ({best_demand['name']})", color="white", fontweight="bold")
    ax.set_facecolor("#1e293b"); ax.tick_params(colors="white")
    for sp in ax.spines.values(): sp.set_color("#334155")
    fig.patch.set_facecolor("#0f172a")
    plt.tight_layout(); plt.savefig(os.path.join(PLOT_DIR,"05_feature_importance_demand.png"), dpi=150, bbox_inches="tight", facecolor="#0f172a"); plt.close()

# Plot 6: Residual distributions
fig, axes = plt.subplots(1, 2, figsize=(16,6))
fig.suptitle("Residual Analysis", fontsize=14, fontweight="bold", color="white")
for ax, res, c, lbl in zip(axes, [ypte.values-yp_pred, ydte.values-yd_pred], ["#6366f1","#10b981"], ["Price Residuals ($)","Demand Residuals (Units)"]):
    ax.hist(res, bins=40, color=c, alpha=0.85, edgecolor="none")
    ax.axvline(0, color="red", linestyle="--", lw=2)
    ax.set_xlabel(lbl, color="white"); ax.set_ylabel("Frequency", color="white")
    ax.set_title(f"{lbl}  mean={np.mean(res):.2f} std={np.std(res):.2f}", color="white")
    ax.set_facecolor("#1e293b"); ax.tick_params(colors="white")
    for sp in ax.spines.values(): sp.set_color("#334155")
fig.patch.set_facecolor("#0f172a")
plt.tight_layout(); plt.savefig(os.path.join(PLOT_DIR,"06_residuals.png"), dpi=150, bbox_inches="tight", facecolor="#0f172a"); plt.close()

print("[OK] All 6 plots saved to: plots/")
print("\n" + "="*60)
print(f"  FINAL SELECTED MODELS")
print(f"  Price Model:  {best_price['name']}  (R2={best_price['r2']:.4f})")
print(f"  Demand Model: {best_demand['name']}  (R2={best_demand['r2']:.4f})")
print(f"  Artifacts: {ARTIFACT_DIR}")
print("="*60)
