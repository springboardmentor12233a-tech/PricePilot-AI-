# Milestone 2 Step 4 — Price Prediction Model Report

**Project:** PricePilot AI
**Milestone:** 2 — Predictive Modeling & Forecasting Setup
**Step:** 4 — Price Prediction Model
**Script:** `eda/train_step4_price.py`
**Date:** 2026-09-05 18:01
**Status:** ✅ COMPLETE

---

## 1. Model

**Model:** Random Forest Regressor (sklearn 1.9.0)

> XGBoost was not installed in this environment. Per the Step 4 specification:
> *"Otherwise use Random Forest if already available."* sklearn's
> `RandomForestRegressor` was used.

**Hyperparameters:**
```python
{
  "n_estimators": 300,
  "max_depth": 20,
  "min_samples_leaf": 10,
  "max_features": "sqrt",
  "n_jobs": -1,
  "random_state": 42
}
```

**Training sample:** 500,000 rows (randomly sampled from 5,947,712 total training rows, seed=42).
Random Forest requires O(n·trees·features) memory; a 500k subsample matches the
approach used by Ridge in Step 3 and is representative of the full training distribution.

**Training time:** 62.7s

---

## 2. Dataset & Splits

| Split | Rows | Date Range |
|---|---|---|
| Train (full) | 5,947,712 | 2022-08-28 to 2024-06-09 |
| Train (sampled) | 500,000 | random subsample, seed=42 |
| Validation | 750,333 | 2024-06-10 to 2024-08-03 |
| Test | 734,640 | 2024-08-04 to 2024-09-26 |

Chronological split from Step 2 — no random splitting.

---

## 3. Feature Set (Step 3 Corrected — 41 features)

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

**Cold-start treatment:** `price_lag_1`, `price_lag_7`, `price_roll_mean_7` NaN fills
replaced with item-level training-set median (identical to Step 3 correction).

---

## 4. Results

### Validation Set

| Metric | Value |
|---|---|
| MAE | 12.2817 |
| RMSE | 81.6863 |
| R² | 0.9484 |

### Test Set

| Metric | Value |
|---|---|
| MAE | 12.7601 |
| RMSE | 87.9131 |
| R² | 0.9456 |

### Comparison with Step 3 LightGBM (corrected)

| Model | Val MAE | Val RMSE | Val R² | Test MAE | Test RMSE | Test R² |
|---|---|---|---|---|---|---|
| LightGBM (Step 3) | 11.9768 | 85.6916 | 0.9432 | 12.2556 | 96.0066 | 0.9352 |
| Random Forest (Step 4) | 12.2817 | 81.6863 | 0.9484 | 12.7601 | 87.9131 | 0.9456 |

---

## 5. Feature Importance (Mean Decrease Impurity)

| Rank | Feature | Importance |
|---|---|---|
| 1 | `price_roll_mean_7` | 0.311725 |
| 2 | `price_lag_1` | 0.301435 |
| 3 | `price_lag_7` | 0.231841 |
| 4 | `demand_lag_1` | 0.027943 |
| 5 | `demand_roll_mean_7` | 0.019582 |
| 6 | `demand_roll_mean_28` | 0.017670 |
| 7 | `demand_lag_3` | 0.012295 |
| 8 | `demand_lag_2` | 0.011363 |
| 9 | `class_name` | 0.008998 |
| 10 | `demand_lag_7` | 0.007444 |

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
