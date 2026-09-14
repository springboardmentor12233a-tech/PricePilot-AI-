# Milestone 2 Step 3 — Price Model Correction Report

**Project:** PricePilot AI
**Milestone:** 2 — Predictive Modeling & Forecasting Setup
**Step:** 3 — Price Model Correction & Retraining
**Script:** `eda/retrain_price_corrected.py`
**Date:** 2026-09-05 17:45
**Status:** ✅ CORRECTION COMPLETE

---

## 1. Original Leakage Problem

The leakage audit (`milestone2_step3_leakage_audit.md`) found that 7 features
in the original Price Prediction model contained or were directly derived from
the target `price_base` through imputation, causing an artificially inflated
R² of ~0.998-0.999:

| Severity | Feature | Root Cause |
|---|---|---|
| 🔴 CRITICAL | `sale_price_before_promo` | `fillna(price_base)` — exact copy for 79% of rows |
| 🔴 CRITICAL | `sale_price_time_promo` | `fillna(price_base)` — exact copy for 79% of rows |
| 🔴 HIGH | `online_price` | `fillna(price_base)` — exact copy for 97.2% of rows |
| 🟡 DERIVED | `promo_discount_amount` | Computed from two leaky cols; 0.0 for 79% of rows |
| 🟡 DERIVED | `promo_discount_pct` | Computed from two leaky cols; 0.0 for 79% of rows |
| 🟡 DERIVED | `price_ratio_to_online` | = price_base / online_price = 1.0 for 97.2% of rows |
| 🟡 DERIVED | `has_online_listing` | Binary flag from online_price presence |

Additionally, a **cold-start leakage** was identified: `price_lag_1`,
`price_lag_7`, and `price_roll_mean_7` were filled with the current `price_base`
on first-ever item-store observations (`prepare_modeling_data.py` lines 291-293).

---

## 2. Features Removed and Why

```
REMOVED (7 features):
  sale_price_before_promo   — fillna(price_base) for 79% of rows
  sale_price_time_promo     — fillna(price_base) for 79% of rows
  online_price              — fillna(price_base) for 97.2% of rows
  promo_discount_amount     — derived from leaky cols; zero for 79%
  promo_discount_pct        — derived from leaky cols; zero for 79%
  price_ratio_to_online     — encodes price_base / price_base = 1.0 for 97.2%
  has_online_listing        — binary derived from online_price presence
```

---

## 3. Cold-Start Leakage Fix

**Original (leaky):**
```python
# prepare_modeling_data.py lines 291-293
df["price_lag_1"]       = df["price_lag_1"].fillna(df["price_base"])
df["price_lag_7"]       = df["price_lag_7"].fillna(df["price_base"])
df["price_roll_mean_7"] = df["price_roll_mean_7"].fillna(df["price_base"])
```

**Corrected (applied in-memory in retrain_price_corrected.py):**

For cold-start rows (`is_new_item_store == 1`), `price_lag_1`, `price_lag_7`,
and `price_roll_mean_7` are replaced with the **item-level training-set median
price** (global training-set median fallback for unseen items).

This is leakage-free: the imputation value is computed from the training
distribution only and does not reference the current row's `price_base`.
The original processed CSV files are NOT modified.

---

## 4. Corrected Feature Set

**Total: 41 features (33 numeric, 8 categorical)**

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

---

## 5. Models Retrained

1. **Baseline: Item-Store Median** — per-item-store median from training set
2. **Ridge Regression** — Ridge(alpha=10.0), 500k-row sample, OrdinalEncoder + StandardScaler
3. **LightGBM GBDT** — full training set, regression objective, early stopping (50 rounds, best_iteration=105)

Demand Forecasting model: **NOT retrained, NOT modified.**

---

## 6. Old vs. Corrected Metrics

### Validation Set

| Model | Metric | Original (leaky) | Corrected (clean) |
|---|---|---|---|
| Baseline | MAE | 27.730865 | 27.730865 |
| Baseline | RMSE | 134.454802 | 134.454802 |
| Baseline | R² | 0.860231 | 0.860231 |
| Ridge | MAE | 1.893938 | 12.028456 |
| Ridge | RMSE | 17.787389 | 64.928946 |
| Ridge | R² | 0.997554 | 0.967406 |
| LightGBM | MAE | 2.435474 | 11.976838 |
| LightGBM | RMSE | 64.003540 | 85.691631 |
| LightGBM | R² | 0.968329 | 0.943228 |

### Test Set

| Model | Metric | Original (leaky) | Corrected (clean) |
|---|---|---|---|
| Baseline | MAE | 36.006508 | 36.006508 |
| Baseline | RMSE | 169.283180 | 169.283180 |
| Baseline | R² | 0.798438 | 0.798438 |
| Ridge | MAE | 1.843756 | 11.442497 |
| Ridge | RMSE | 10.869907 | 51.684479 |
| Ridge | R² | 0.999169 | 0.981211 |
| LightGBM | MAE | 3.171714 | 12.255584 |
| LightGBM | RMSE | 82.460268 | 96.006556 |
| LightGBM | R² | 0.952173 | 0.935169 |

**Best corrected model (val MAE): LightGBM**

> The reduction in R² from ~0.998 is expected and correct. The original score
> was inflated by target-proxy features. The corrected metrics reflect genuine
> predictive performance from historical price trajectories, catalog, and
> promotion schedule.

### Training Time

| Model | Corrected (s) |
|---|---|
| Baseline | 0.80 |
| Ridge | 1.06 |
| LightGBM | 48.90 |

---

## 7. Top Corrected Price Model Features (LightGBM)

| Rank | Feature | Importance (Gain) | Splits |
|---|---|---|---|
| 1 | `price_lag_1` | 3,056,292,035,284 | 2,309 |
| 2 | `price_lag_7` | 1,074,160,834,052 | 2,335 |
| 3 | `price_roll_mean_7` | 787,579,952,235 | 1,193 |
| 4 | `item_type` | 50,564,120,796 | 735 |
| 5 | `subclass_name` | 27,064,718,554 | 1,146 |
| 6 | `day_of_year` | 15,762,048,435 | 1,965 |
| 7 | `demand_roll_std_28` | 11,795,758,628 | 1,541 |
| 8 | `demand_roll_mean_28` | 11,426,950,443 | 1,312 |
| 9 | `year` | 10,003,990,502 | 653 |
| 10 | `dept_name` | 8,734,297,001 | 522 |

---

## 8. Final Leakage Verification

| Check | Result |
|---|---|
| `price_base_absent_from_features` | ✅ PASS |
| `target_proxy_features_excluded` | ✅ PASS |
| `no_current_price_as_feature` | ✅ PASS |
| `price_lag_1_not_perfect_proxy` | ✅ PASS |
| `price_lag_7_not_perfect_proxy` | ✅ PASS |
| `price_roll_mean_7_not_perfect_proxy` | ✅ PASS |
| `cold_start_lag_not_current_target` | ✅ PASS |
| `lgbm_model_features_clean` | ✅ PASS |

---

## 9. Suitability for Blind Price Prediction

The corrected Price model is **suitable for blind price prediction** (Scenario A in
the audit report):

- All features are genuinely available before the transaction occurs
- Historical price lags (`price_lag_1`, `price_roll_mean_7`) are the primary signal
- Product taxonomy, store attributes, calendar, and promo schedule are all pre-known
- No current-day price enters the feature matrix
- Cold-start rows use a leakage-free item-level training median

The model honestly predicts transaction prices from historical price trajectories,
product characteristics, and the promotional schedule — without knowing the answer
in advance.

---

## 10. Demand Forecasting Model Status

**The Demand Forecasting model was NOT modified.**

- All `models/demand/` artifacts: **unchanged**
- Target: `quantity` — unchanged
- `price_base` remains a valid **conditional input** (planned price) for demand estimation
- All demand lag and rolling features were previously verified as correctly lagged
- Status: ✅ **Valid for conditional demand forecasting**

---

*Report generated by `eda/retrain_price_corrected.py` — PricePilot AI Milestone 2 Step 3*
