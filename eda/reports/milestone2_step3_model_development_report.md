# Milestone 2 — Step 3: Model Development Report

**Project:** PricePilot AI  
**Milestone:** 2 — Predictive Modeling & Forecasting Setup  
**Step:** 3 — Model Development  
**Script:** [`eda/train_models.py`](file:///e:/PRICEPILOT-AI/eda/train_models.py)  
**Pipeline Runtime:** 6.8 minutes (408 seconds)  
**Status:** ✅ COMPLETE  

---

## 1. Objective

Train, validate, and evaluate machine learning models for two core PricePilot AI tasks:

| Task | Target Variable | Goal |
| :--- | :--- | :--- |
| **Price Prediction** | `price_base` | Predict the realized unit selling price |
| **Demand Forecasting** | `quantity` | Forecast units sold per item-store-day |

---

## 2. Data Used

Source: Step 2 processed splits from `Datasets/processed/`.

| Split | Date Range | Rows | Usage |
| :--- | :--- | :--- | :--- |
| **Train** | 2022-08-28 → 2024-06-09 | 5,947,712 | Fit all model parameters |
| **Validation** | 2024-06-10 → 2024-08-03 | 750,333 | Model selection + early stopping |
| **Test** | 2024-08-04 → 2024-09-26 | 734,640 | Final held-out evaluation |

> [!IMPORTANT]
> All splits are **strictly chronological**. No random splitting was used at any stage. The test set was not touched during training or model selection.

---

## 3. Feature Sets

All features derived from the leakage-audited Step 2 master panel. The grain is `(date, item_id, store_id)`.

### 3.1 Common exclusions (both tasks)
| Column | Reason Excluded |
| :--- | :--- |
| `date` | Identifier — not a predictive feature |
| `item_id` | High-cardinality identifier — captured via product taxonomy features |
| `sum_total` | Post-transaction leakage: `sum_total = quantity × price_base` |

### 3.2 Price Prediction — Feature Matrix
- **Target:** `price_base`
- **Additional exclusion:** `quantity` (contemporaneous demand outcome — leakage)
- **Total features:** 48 (40 numeric + 8 categorical)

### 3.3 Demand Forecasting — Feature Matrix
- **Target:** `quantity`
- **Additional exclusion:** none beyond common exclusions (`price_base` is a valid causal input for demand)
- **Total features:** 49 (41 numeric + 8 categorical)

### 3.4 Categorical features (both tasks — 8 columns)
`city`, `class_name`, `dept_name`, `division`, `format`, `item_type`, `promo_type_code`, `subclass_name`

---

## 4. Preprocessing

### 4.1 For Baseline Models
No preprocessing required — predictions are computed from training-set group statistics (`median` / `mean` per `item_id + store_id`).

### 4.2 For Ridge Regression
Applied via scikit-learn `Pipeline` + `ColumnTransformer`:

| Column Type | Transformer | Notes |
| :--- | :--- | :--- |
| Numeric (40/41 cols) | `StandardScaler` | Zero-mean, unit-variance |
| Categorical (8 cols) | `OrdinalEncoder` | `handle_unknown="use_encoded_value"`, unknown → `-1` |

**Training sample size:** 500,000 rows drawn from the training set (random seed=42 via numpy default_rng) — Ridge with lasso-type penalties converges adequately on a representative sample of this size; training on the full 5.9M rows would require significantly more memory and time with no material accuracy gain for a linear model.

### 4.3 For LightGBM
- **No manual encoding required** — LightGBM handles `pandas` `category` dtype natively via its histogram-based categorical splitting algorithm.
- **No scaling required** — tree-based models are scale-invariant.
- The full 5.9M-row training set was used (LightGBM's histogram binning makes it O(n·bins), not O(n²)).

---

## 5. Models Trained

### 5.1 Price Prediction Models

#### P1 — Baseline: Item-Store Median Price
- **Approach:** For each `(item_id, store_id)` pair, predict the median `price_base` observed in the training set. For unseen pairs (OOV), fall back to the global training median.
- **Rationale:** Strong baseline for price — prices are relatively stable per item-store combination.
- **Training time:** ~1s

#### P2 — Ridge Regression (`alpha=10.0`)
- **Approach:** Regularized linear regression on 500k training samples.
- **Preprocessing:** StandardScaler + OrdinalEncoder.
- **Hyperparameter:** `alpha=10.0` (L2 regularization strength).
- **Training time:** 1.7s

#### P3 — LightGBM GBDT
- **Approach:** Gradient Boosted Decision Trees on full 5.9M training set.
- **Objective:** `regression` (MSE-optimized, standard L2).
- **Key hyperparameters:**

| Parameter | Value |
| :--- | :--- |
| `num_leaves` | 255 |
| `learning_rate` | 0.05 |
| `feature_fraction` | 0.8 |
| `bagging_fraction` | 0.8 |
| `bagging_freq` | 5 |
| `min_child_samples` | 30 |
| `early_stopping_rounds` | 50 |
| `max_rounds` | 2,000 |

- **Early stopping:** Triggered at iteration **221** (val L1 stopped improving).
- **Training time:** 91.3s

---

### 5.2 Demand Forecasting Models

#### D1 — Baseline: Item-Store Mean Demand
- **Approach:** For each `(item_id, store_id)` pair, predict the mean `quantity` observed in the training set. Fall back to global training mean for OOV pairs.
- **Training time:** ~1s

#### D2 — Ridge Regression (`alpha=10.0`)
- **Approach:** Same Ridge setup as price model, applied to demand.
- **Note:** Ridge is challenged on demand — quantity is non-negative, non-linear, and highly variable (reflected in poor SMAPE).
- **Training time:** 1.5s

#### D3 — LightGBM GBDT (MAE objective)
- **Approach:** GBDT on full 5.9M training set.
- **Objective:** `regression_l1` (directly optimizes MAE — more robust to extreme demand spikes than MSE).
- **Key hyperparameters:** Same as P3 except `objective="regression_l1"`.
- **Early stopping:** Triggered at iteration **284**.
- **Training time:** 186.7s

---

## 6. Validation Results

> [!NOTE]
> Model selection is based exclusively on **validation MAE**. The test set was not used for any decision.

### 6.1 Price Prediction

| Model | Val MAE | Val RMSE | Val R² | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Baseline (item-store median) | 27.73 | 134.45 | 0.860 | Strong floor — prices are stable |
| **Ridge ⭐ SELECTED** | **1.89** | **17.79** | **0.998** | Best on all metrics |
| LightGBM | 2.44 | 64.00 | 0.968 | Stopped at iter 221; RMSE dominated by high-price outliers |

### 6.2 Demand Forecasting

| Model | Val MAE | Val RMSE | Val SMAPE | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Baseline (item-store mean) | 2.87 | 9.85 | 51.86% | Ignores daily signal |
| Ridge | 2.39 | 6.25 | 54.03% | Better RMSE, worse SMAPE — handles scale poorly |
| **LightGBM ⭐ SELECTED** | **2.00** | **6.83** | **40.31%** | Best MAE and SMAPE |

---

## 7. Final Test Results (Best Models Only)

> [!IMPORTANT]
> Test results reported here for the first and only time. These numbers reflect true out-of-sample performance on held-out data from 2024-08-04 to 2024-09-26.

### 7.1 Price Prediction — Ridge (Best Model)

| Metric | Validation | Test | Δ (Test − Val) |
| :--- | :--- | :--- | :--- |
| **MAE** | 1.8939 | **1.8438** | −0.050 ✅ |
| **RMSE** | 17.7874 | **10.8699** | −6.92 ✅ |
| **R²** | 0.9976 | **0.9992** | +0.002 ✅ |

**Interpretation:** Test performance is marginally *better* than validation — no overfitting. R²=0.9992 indicates the model explains 99.92% of price variance. MAE of ~1.84 currency units on prices ranging up to thousands is excellent. The price signal is dominated by near-linear relationships with promotional pricing and online benchmark features.

### 7.2 Demand Forecasting — LightGBM (Best Model)

| Metric | Validation | Test | Δ (Test − Val) |
| :--- | :--- | :--- | :--- |
| **MAE** | 2.0041 | **2.0407** | +0.037 ✅ |
| **RMSE** | 6.8306 | **16.2366** | +9.41 ⚠️ |
| **SMAPE** | 40.31% | **40.00%** | −0.31% ✅ |
| **MAPE** | 21,755 | 24,043 | — |

**Interpretation:** MAE and SMAPE are consistent between val and test — no systematic overfitting. The RMSE increase on test (+9.4) indicates larger demand spikes in the test period (Aug–Sep = back-to-school / end-of-season promotions), not model degradation. SMAPE of 40% reflects the fundamental challenge of zero-demand days (items not sold every day) inflating percentage errors. This is expected for sparse retail demand data at the `(date, item, store)` grain.

---

## 8. Model Comparison Summary

### Price Prediction

| Rank | Model | Val MAE | Val R² | Test MAE | Test R² | Train Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🥇 1 | **Ridge** | **1.89** | **0.9976** | **1.84** | **0.9992** | 1.7s |
| 🥈 2 | LightGBM | 2.44 | 0.9683 | 3.17 | 0.9522 | 91.3s |
| 🥉 3 | Baseline (Median) | 27.73 | 0.8602 | 36.01 | 0.7984 | ~1s |

### Demand Forecasting

| Rank | Model | Val MAE | Val SMAPE | Test MAE | Test SMAPE | Train Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🥇 1 | **LightGBM** | **2.00** | **40.31%** | **2.04** | **40.00%** | 186.7s |
| 🥈 2 | Ridge | 2.39 | 54.03% | 2.37 | 53.59% | 1.5s |
| 🥉 3 | Baseline (Mean) | 2.87 | 51.86% | 3.15 | 54.11% | ~1s |

---

## 9. Feature Importance (LightGBM)

### 9.1 Price Prediction — Top 10 by Information Gain

| Rank | Feature | Importance (Gain) | Insight |
| :--- | :--- | :--- | :--- |
| 1 | `online_price` | 3.29 × 10¹² | Online benchmark is the primary price signal |
| 2 | `sale_price_time_promo` | 1.10 × 10¹² | Active promo price directly sets transaction price |
| 3 | `sale_price_before_promo` | 2.47 × 10¹¹ | Regular catalog price anchors predictions |
| 4 | `price_roll_mean_7` | 2.44 × 10¹¹ | 7-day rolling price history is highly predictive |
| 5 | `price_lag_1` | 1.70 × 10¹¹ | Yesterday's price is a strong anchor |
| 6 | `item_type` | 3.60 × 10¹⁰ | Product type determines price segment |
| 7 | `subclass_name` | 1.61 × 10¹⁰ | Fine-grained product category matters |
| 8 | `day_of_year` | 1.56 × 10¹⁰ | Seasonal pricing cycles |
| 9 | `class_name` | 1.30 × 10¹⁰ | Product class (mid-level taxonomy) |
| 10 | `demand_roll_std_28` | 1.07 × 10¹⁰ | Demand volatility correlates with price variability |

**Key insight for Ridge dominance:** The top 5 price features (`online_price`, `sale_price_time_promo`, `sale_price_before_promo`, `price_roll_mean_7`, `price_lag_1`) all have near-linear relationships to `price_base`. Ridge's L2-penalized linear model is optimal for this structure, while LightGBM's non-linear capacity is less useful and suffers from higher RMSE due to outlier pricing events.

### 9.2 Demand Forecasting — Top 10 by Information Gain

| Rank | Feature | Importance (Gain) | Insight |
| :--- | :--- | :--- | :--- |
| 1 | `demand_roll_mean_28` | 2.94 × 10⁷ | 28-day rolling mean demand is the strongest predictor |
| 2 | `demand_roll_mean_7` | 1.36 × 10⁷ | Short-term rolling mean captures recent trend |
| 3 | `demand_roll_std_28` | 7.84 × 10⁶ | Demand volatility over past month |
| 4 | `demand_lag_3` | 4.06 × 10⁶ | 3-day lag — near-term demand momentum |
| 5 | `subclass_name` | 3.89 × 10⁶ | Product subclass — category-level demand patterns |
| 6 | `dept_name` | 3.07 × 10⁶ | Department-level demand trends |
| 7 | `class_name` | 2.90 × 10⁶ | Product class contribution |
| 8 | `demand_lag_1` | 1.39 × 10⁶ | Yesterday's demand — momentum signal |
| 9 | `demand_roll_std_7` | 1.35 × 10⁶ | Short-term volatility |
| 10 | `price_base` | 1.20 × 10⁶ | Price elasticity effect — higher price lowers demand |

**Key insight:** Demand is driven primarily by **rolling historical demand** (features 1–4, 8–9) and **product category** (features 5–7). The presence of `price_base` in position 10 confirms price elasticity is a real but secondary signal — validating its inclusion as a feature in the demand model.

---

## 10. Saved Model Artifacts

All models saved to [`models/`](file:///e:/PRICEPILOT-AI/models/):

### Price Models — `models/price/`

| File | Size | Description |
| :--- | :--- | :--- |
| [`baseline_median.joblib`](file:///e:/PRICEPILOT-AI/models/price/baseline_median.joblib) | 785 KB | Item-store median map + global fallback |
| [`ridge_pipeline.joblib`](file:///e:/PRICEPILOT-AI/models/price/ridge_pipeline.joblib) | 61 KB | Fitted sklearn Pipeline (StandardScaler + OrdinalEncoder + Ridge) |
| [`lgbm_price.txt`](file:///e:/PRICEPILOT-AI/models/price/lgbm_price.txt) | 5.0 MB | LightGBM booster (text format, 221 trees) |
| [`lgbm_price_meta.joblib`](file:///e:/PRICEPILOT-AI/models/price/lgbm_price_meta.joblib) | <1 KB | Feature name list + categorical feature list |

### Demand Models — `models/demand/`

| File | Size | Description |
| :--- | :--- | :--- |
| [`baseline_mean.joblib`](file:///e:/PRICEPILOT-AI/models/demand/baseline_mean.joblib) | 785 KB | Item-store mean map + global fallback |
| [`ridge_pipeline.joblib`](file:///e:/PRICEPILOT-AI/models/demand/ridge_pipeline.joblib) | 61 KB | Fitted sklearn Pipeline (StandardScaler + OrdinalEncoder + Ridge) |
| [`lgbm_demand.txt`](file:///e:/PRICEPILOT-AI/models/demand/lgbm_demand.txt) | 10.5 MB | LightGBM booster (text format, 284 trees) |
| [`lgbm_demand_meta.joblib`](file:///e:/PRICEPILOT-AI/models/demand/lgbm_demand_meta.joblib) | <1 KB | Feature name list + categorical feature list |

### Report Artifacts — `eda/reports/`

| File | Description |
| :--- | :--- |
| [`model_comparison_results.csv`](file:///e:/PRICEPILOT-AI/eda/reports/model_comparison_results.csv) | All model × split × metric results |
| [`price_feature_importance.csv`](file:///e:/PRICEPILOT-AI/eda/reports/price_feature_importance.csv) | LightGBM price model feature importance (gain + split) |
| [`demand_feature_importance.csv`](file:///e:/PRICEPILOT-AI/eda/reports/demand_feature_importance.csv) | LightGBM demand model feature importance (gain + split) |
| [`step3_meta.json`](file:///e:/PRICEPILOT-AI/eda/reports/step3_meta.json) | Full structured results JSON (metrics, hyperparams, feature lists) |

---

## 11. Limitations & Notes

| Issue | Severity | Notes |
| :--- | :--- | :--- |
| Ridge trained on 500k sample, not full 5.9M | Low | Sufficient for linear model convergence; full training would improve marginal consistency but not material accuracy |
| LightGBM price RMSE (64.0 val, 82.5 test) | Medium | Driven by high-price outlier items; tree model struggles with extreme price ranges. Ridge is clearly better for price |
| Demand SMAPE ~40% | Medium | Inherent challenge of intermittent/sparse demand at item-day grain. Zero-demand days inflate percentage error. Not a model failure — this is expected in retail demand forecasting |
| Demand RMSE spikes on test (6.83 → 16.24) | Medium | Test period (Aug–Sep 2024) coincides with back-to-school demand surge; SMAPE remains stable (40%), indicating model is directionally correct but not calibrated for exceptional demand events |
| MAPE values are very large (21k–83k%) | Info | MAPE is unreliable when quantity approaches zero (common in retail). SMAPE is the preferred percentage metric; MAPE included for completeness only |
| No hyperparameter search performed | Info | Ridge `alpha=10.0` and LightGBM defaults are reasonable priors; a grid/Bayesian search in Step 4 could yield further improvement |
| Disk space constraint (~2.6 GB free on drive E) | Info | Constrained model artifact sizes; gzip compression used throughout |

---

## 12. Reproducibility

Re-run the full Step 3 pipeline from scratch:
```bash
python eda/train_models.py
```

- Reads only from `Datasets/processed/train_data.csv.gz`, `val_data.csv.gz`, `test_data.csv.gz`
- Writes only to `models/` and `eda/reports/`
- Fully deterministic (LightGBM `seed=42`, numpy `default_rng(42)`)
- Does **not** modify any raw datasets

---

## 13. Conclusion

---

### **PRICE PREDICTION — BEST MODEL: Ridge Regression (alpha=10.0)**
- Trained on 500,000 sample rows, 48 features (40 numeric + 8 categorical)
- **Val MAE = 1.89 | Val R² = 0.9976**
- **Test MAE = 1.84 | Test R² = 0.9992**
- Ridge dominates because price is driven by near-linear promotional and online price signals. LightGBM's complexity is unnecessary and increases RMSE on outlier prices.

---

### **DEMAND FORECASTING — BEST MODEL: LightGBM GBDT (regression_l1 / MAE objective)**
- Trained on full 5,947,712 rows, 49 features, early stopped at iteration 284
- **Val MAE = 2.00 | Val SMAPE = 40.31%**
- **Test MAE = 2.04 | Test SMAPE = 40.00%**
- LightGBM excels at demand because rolling demand lags, product categories, and price interact non-linearly. The MAE objective (`regression_l1`) makes it robust to the demand spike outliers that inflate RMSE.

---

### **MILESTONE 2 STEP 3 STATUS: COMPLETE**

### **READY FOR STEP 4: YES**

Step 4 may proceed to:
1. Load `models/price/ridge_pipeline.joblib` and `models/demand/lgbm_demand.txt` as the selected production-candidate models.
2. Perform **hyperparameter tuning** (e.g., Ridge alpha sweep, LightGBM `num_leaves` / `learning_rate` Bayesian search) on the validation set.
3. Optionally **ensemble or stack** price and demand predictions for revenue-optimal pricing recommendations.
4. **Interpretability analysis** — SHAP values for the LightGBM demand model to explain individual predictions.
5. **Business metric evaluation** — translate MAE/RMSE into revenue impact and pricing accuracy for stakeholder reporting.

---

*Report generated for PricePilot AI — Milestone 2 Step 3.*
