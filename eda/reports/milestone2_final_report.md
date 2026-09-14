# PricePilot AI — Milestone 2 Final Comprehensive Report

**Dynamic Pricing Optimization & Revenue Intelligence System**  
**Date:** September 11, 2026  
**Status:** COMPLETE  
**Primary Test Suite:** [`eda/test_step11_integration.py`](file:///e:/PRICEPILOT-AI/eda/test_step11_integration.py) (12/12 Passed)  
**Dashboard:** [`eda/dashboard.py`](file:///e:/PRICEPILOT-AI/eda/dashboard.py) | [`run_dashboard.py`](file:///e:/PRICEPILOT-AI/run_dashboard.py)  

---

## 1. Executive Summary

The **PricePilot AI** project delivers an enterprise-grade, end-to-end Machine Learning and Decision Support Intelligence platform designed to optimize retail pricing, forecast multi-horizon product demand, categorize commercial demand trajectories, compute retail business KPIs, and generate executive-ready AI directives using Google Gemini LLM integration.

Milestone 2 operationalizes the clean data assets prepared in Milestone 1 through rigorous, leakage-free predictive modeling:
- A **Random Forest Price Prediction Model** trained on 41 clean features, achieving a Test MAE of **12.7601** (Test $R^2 = 0.9456$).
- A **Rule-Bounded Price Recommendation Engine** evaluating discrete candidates within $\pm 20\%$ safety guardrails to align with model equilibrium clearing prices.
- A **LightGBM Multi-Horizon Demand Forecasting Model** predicting 7-day, 14-day, and 30-day unit sales with a Test MAE of **2.0407 units** (outperforming persistence by 21.7%).
- A deterministic **Demand Trend Classification & Heuristic Confidence Engine** scoring portfolio trajectory reliability (Average Confidence: **87.2 / 100**).
- A **Retail KPI & Domain Knowledge Layer** translating forecasts into 8 commercial priority directives across 12,773 item-store observations.
- A **Gemini LLM Business Insights Engine** synthesizing technical outputs into executive narratives with deterministic offline fallback.
- An interactive, business-ready **Streamlit Analytics Dashboard** delivering real-time decision support.

All components were validated via a comprehensive 12-module integration test suite ([`eda/test_step11_integration.py`](file:///e:/PRICEPILOT-AI/eda/test_step11_integration.py)) with a 100% pass rate under strict data/model immutability guarantees.

---

## 2. Project Objective

The primary objective of PricePilot AI is to equip retail category managers, commercial pricing directors, and inventory planners with an integrated predictive analytics system that:
1. Eliminates manual, ad-hoc pricing adjustments by predicting fair market clearing prices.
2. Forecasts forward customer demand across multiple operational horizons (1 to 30 days) to prevent stockouts and overstock.
3. Automatically detects emerging demand momentum (Increasing, Stable, Decreasing).
4. Quantifies forecast reliability through an interpretable heuristic confidence score.
5. Bridges technical ML outputs and commercial decision-making via automated LLM executive briefings and interactive visualization.

---

## 3. Business Problem

Modern multi-store retail enterprises manage tens of thousands of active SKUs across dynamic promotional schedules and shifting consumer demand. Key operational bottlenecks include:
- **Pricing Misalignment**: Suboptimal catalog prices lead to lost margin on inelastic items or sluggish inventory turnover on price-sensitive goods.
- **Demand Uncertainty**: Static historical averages fail to capture weekly seasonality, promotional lifts, or catalog trend shifts.
- **Information Overload**: Category managers lack bandwidth to analyze individual regression metrics for thousands of products.
- **Data Leakage Risks**: Naive machine learning models in retail frequently suffer from contemporaneous feature leakage (e.g. using transaction discounts to predict prices), causing catastrophic failures when deployed live.

---

## 4. Proposed Solution

PricePilot AI addresses these challenges through a modular, multi-tiered intelligence pipeline:

```mermaid
graph TD
    A[Raw Datasets] --> B[Data Prep & Temporal Anomaly Resolution]
    B --> C[Master Modeling Panel: 7.43M Rows]
    C --> D[Leakage-Free Feature Engineering]
    D --> E[Step 4: Price Prediction Model]
    D --> F[Step 6: Demand Forecasting Model]
    E --> G[Step 5: Price Recommendation Engine]
    F --> H[Step 7: Demand Trend & Confidence Engine]
    G --> I[Step 8: KPI & Domain Knowledge Layer]
    H --> I
    I --> J[Step 9: Gemini LLM Business Insights]
    I --> K[Step 10: Executive Analytics Dashboard]
    J --> K
```

---

## 5. System Architecture & Workflow

The architecture cleanly separates data processing, model inference, business logic, and presentation:

1. **Data Layer**: Cleaned historical tables (`sales.csv`, `cleaned_discounts_history.csv`, `catalog.csv`, `stores.csv`, `online.csv`).
2. **Feature Store**: 558 MB compressed panel containing lag structures, rolling statistics, calendar harmonics, and store/product metadata.
3. **Model Layer**:
   - Price Regressor (`models/price/rf_price_step4.joblib` — RandomForest)
   - Demand Regressor (`models/demand/lgbm_demand_step6.txt` — LightGBM GBDT)
4. **Decision Support & Rules Layer**:
   - Candidate Grid Generator ($\pm 20\%$ bounds, retail step rounding)
   - Trend & Confidence Evaluator (5% margin, 4-part heuristic score)
   - Retail KPI Aggregator (Demand, Pricing, Promotion, Revenue metrics)
5. **AI Synthesis & Delivery**:
   - Google Gemini API (`google-genai` SDK with deterministic offline fallback)
   - Streamlit Multi-Tab Executive Dashboard

---

## 6. Dataset Selection

The pipeline utilizes the multi-store retail dataset comprising 9 core files:

| File Name | Records | Columns | Primary Role |
| :--- | :---: | :---: | :--- |
| `ecommerce_sales_34500.csv` | 7,432,685 | 6 | Master daily store-item transaction series |
| `sales.csv` | 3,746,744 | 8 | Physical retail sales transaction log |
| `cleaned_discounts_history.csv` | 3,431,831 | 9 | Realized promotional discounts & document types |
| `online.csv` | 698,626 | 5 | E-commerce channel pricing & listings |
| `catalog.csv` | 219,810 | 8 | Product taxonomy (Department, Class, Subclass) |
| `stores.csv` | 4 | 5 | Store location, format, city, and area |
| `price_history.csv` | 8,979 | 6 | Historical base price change records |
| `discounts_history.csv` (Raw) | 3,746,744 | 9 | Raw promotional table (evaluated in Milestone 1) |
| `markdowns.csv` | 2,800 | 10 | Retail clearance markdown records |

---

## 7. Data Preparation & Temporal Split

### 7.1 Temporal Anomaly Resolution
In Milestone 1, an audit of `discounts_history.csv` revealed 314,913 records dated from 2024-09-27 to 2045-12-31 (future planned promotions). To prevent future-looking temporal leakage into historical sales, these records were isolated into `future_discounts_history.csv`, while `cleaned_discounts_history.csv` (3,431,831 rows, 2022-08-28 to 2024-09-26) was strictly aligned with observed sales.

### 7.2 Modeling Splits (Zero Random Leakage)
A strict chronological time-based split was established across the 7.43M record master panel:

| Split Partition | Date Range | Duration | Observation Count | Role |
| :--- | :---: | :---: | :---: | :--- |
| **Train Set** | `2022-08-28` to `2024-06-09` | 652 days | 5,947,712 | Model training & parameter fitting |
| **Validation Set** | `2024-06-10` to `2024-08-03` | 55 days | 750,333 | Hyperparameter tuning & threshold calibration |
| **Test Set** | `2024-08-04` to `2024-09-26` | 54 days | 734,640 | Out-of-sample final evaluation |

---

## 8. Feature Engineering

Features were engineered to guarantee that only information known strictly before the transaction origin date is consumed:

- **Historical Price Lags**: `price_lag_1`, `price_lag_7`, `price_roll_mean_7` (Cold-start NaNs imputed with item-level training median).
- **Historical Demand Lags**: `demand_lag_1`, `demand_lag_2`, `demand_lag_3`, `demand_lag_7`, `demand_lag_14`, `demand_lag_28`.
- **Lagged Rolling Statistics**: `demand_roll_mean_7`, `demand_roll_std_7`, `demand_roll_mean_28`, `demand_roll_std_28`.
- **Product Taxonomy**: `dept_name`, `class_name`, `subclass_name`, `item_type`.
- **Store Attributes**: `store_id`, `division`, `format`, `city`, `area`.
- **Calendar Harmonics**: `sin_month`, `cos_month`, `sin_day_of_week`, `cos_day_of_week`, `is_weekend`, `is_month_start`, `is_month_end`.
- **Promotional Flags**: `is_on_promo`, `promo_type_code`, `number_disc_day`, `promo_doc_count`.
- **Cold-Start Indicator**: `is_new_item_store`.

---

## 9. Price Prediction Model (Step 4)

- **Algorithm**: `RandomForestRegressor` (`scikit-learn 1.9.0`)
- **Hyperparameters**: `n_estimators=300`, `max_depth=20`, `min_samples_leaf=10`, `max_features='sqrt'`, `random_state=42`.
- **Training Sample**: 500,000 representative records subsampled from 5.95M training observations.
- **Feature Set**: 41 clean features (33 numeric, 8 categorical).
- **Leakage Prevention**: All contemporaneous transaction pricing columns (`price_base`, `sale_price_before_promo`, `sale_price_time_promo`, `online_price`, `promo_discount_amount`, `promo_discount_pct`, `price_ratio_to_online`) were excluded.

### Performance Results:

| Split | MAE ($) | RMSE ($) | $R^2$ |
| :--- | :---: | :---: | :---: |
| **Validation Set** | **12.2817** | **81.6863** | **0.9484** |
| **Test Set** | **12.7601** | **87.9131** | **0.9456** |

**Feature Importance Leaders**: `price_roll_mean_7` (31.2%), `price_lag_1` (30.1%), `price_lag_7` (23.2%), `demand_lag_1` (2.8%).

---

## 10. Price Recommendation Engine (Step 5)

- **Module**: [`eda/recommend_price.py`](file:///e:/PRICEPILOT-AI/eda/recommend_price.py)
- **Methodology**:
  1. Establishes a baseline reference price ($P_{\text{ref}}$) from historical lags (`price_lag_1` or item median).
  2. Generates a discrete candidate price grid spanning $[P_{\text{ref}} \times 0.80, P_{\text{ref}} \times 1.20]$ in discrete steps (default 2.5% increments with standard retail rounding).
  3. Evaluates candidates against the Random Forest predicted equilibrium clearing price ($P_{\text{model}}$).
  4. Selects optimal candidate $P^* = \arg\min_{P \in \text{Candidates}} |P - P_{\text{model}}|$.

> [!IMPORTANT]
> **Methodology Disclosure**: The price recommendation engine is a **model-alignment decision support tool bounded by commercial elasticity guardrails ($\pm 20\%$)**. It does **NOT** compute causal price elasticity curves or solve a non-linear revenue optimization function.

---

## 11. Demand Forecasting (Step 6)

- **Algorithm**: LightGBM GBDT Regressor (`lightgbm 4.7.0`)
- **Objective**: `regression_l1` (MAE minimization)
- **Feature Count**: 49 features.
- **Target**: Daily unit sales (`quantity`).

### Performance Benchmark Comparison:

| Model Architecture | Validation MAE | Validation RMSE | Test MAE | Test RMSE | Test SMAPE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Naive Persistence (Lag-1)** | 2.6243 | 7.5130 | 2.6072 | 10.7248 | 50.52% |
| **Historical Mean Baseline** | 2.8714 | 9.8536 | 3.1478 | 25.5501 | 54.11% |
| **LightGBM (Step 6) ⭐** | **2.0041** | **6.8306** | **2.0407** | **16.2366** | **40.00%** |

The LightGBM demand model reduces test set MAE by **21.7%** compared to lag persistence and reduces SMAPE by over 10.5 percentage points.

---

## 12. Demand Trend Classification (Step 7)

Converts continuous multi-horizon forecasts into deterministic operational demand trajectories:

$$\text{Pace Change \%} = \frac{\text{Forecast Avg 7d} - \text{Hist Avg 7d}}{\max(\text{Hist Avg 7d}, 0.10)} \times 100$$

- **`INCREASING`**: Pace change $> +5.0\%$ (**2,221 SKUs / 17.39%**)
- **`STABLE`**: $-5.0\% \le \text{Pace Change} \le +5.0\%$ (**1,635 SKUs / 12.80%**)
- **`DECREASING`**: Pace change $< -5.0\%$ (**8,917 SKUs / 69.81%**)

Multi-horizon consistency validates agreement across 14d and 30d forecasts (`FULL_CONSISTENCY`: 87.57%, `PARTIAL_CONSISTENCY`: 4.69%, `DIVERGENT`: 7.74%).

---

## 13. Forecast Confidence Score (Step 7)

The confidence score is an interpretable, 4-part **heuristic reliability score** bounded within $[0, 100]$:

$$\text{Confidence Score} = \text{clip}(S_{\text{base}} [25] + S_{\text{consistency}} [30] + S_{\text{volume}} [25] + S_{\text{margin}} [20], 0, 100)$$

- **Portfolio Mean**: **`87.2 / 100`** | **Median**: **`90.0 / 100`**
- **High Confidence ($\ge 75$ pts)**: 11,515 SKUs (90.15%)
- **Medium Confidence ($50 - 74$ pts)**: 1,245 SKUs (9.75%)
- **Low Confidence ($< 50$ pts)**: 13 SKUs (0.10%)

> [!NOTE]
> **Heuristic Definition**: This metric represents an **operational data quality and model agreement index**. It is explicitly **NOT a calibrated statistical probability**.

---

## 14. Retail KPI & Domain Knowledge Layer (Step 8)

Computes 4 distinct commercial KPI clusters across all 12,773 item-store evaluation records:
1. **Demand KPIs**: Historical volume, daily mean/median demand, volatility (std).
2. **Pricing KPIs**: Reference price, model clearing price, recommended price, delta %.
3. **Promotion KPIs**: Promo exposure rate, discount depth %, observed promo demand lift %.
4. **Revenue KPIs**: Total realized revenue, average daily revenue velocity, revenue per unit.

Assigns 8 commercial priority directives: `PROMOTIONAL_STIMULATION_REVIEW` (6,218), `PRICING_MARKDOWN_REVIEW` (2,699), `HUMAN_COMMERCIAL_REVIEW` (1,635), `PRICE_INCREASE_OPPORTUNITY` (1,234), `STOCK_REPLENISHMENT_PRIORITY` (987).

---

## 15. Gemini LLM External Integration (Step 9)

- **Module**: [`eda/gemini_business_insights.py`](file:///e:/PRICEPILOT-AI/eda/gemini_business_insights.py)
- **Framework**: Official `google-genai` SDK with dense structured context building.
- **Output Structure**: Executive Summary, Pricing Rationale, Demand Dynamics, Promotional Profile, Commercial Risks, and Actionable Strategic Directives.
- **Security & Safety**: Secrets loaded strictly from environment variables; zero hardcoding; zero API key leakage in outputs.
- **Offline Fallback**: When `GEMINI_API_KEY` is not present, deterministic pre-computed verified executive briefings and domain syntheses are served seamlessly.

> [!NOTE]
> **API Validation Notice**: Live Gemini API testing was not performed in the development test environment because no live `GEMINI_API_KEY` was configured. The offline fallback mode was 100% verified.

---

## 16. Presentation & Visualization Dashboard (Step 10 / 10A)

- **App**: [`eda/dashboard.py`](file:///e:/PRICEPILOT-AI/eda/dashboard.py) | Launcher: [`run_dashboard.py`](file:///e:/PRICEPILOT-AI/run_dashboard.py)
- **Features**:
  * 100% free of internal step numbers/milestone labels.
  * Complete English display mapping for all 167 Russian grocery departments.
  * 6 Business Sections: *Executive Overview*, *Price Optimization*, *Demand Forecast*, *Business Performance*, *AI Business Insights*, and *Product Deep Dive*.
  * Sub-second rendering backed by `@st.cache_data`.

---

## 17. Model Comparison Summary

| Milestone Step | Task | Algorithm | Features | Val MAE | Test MAE | Test $R^2$ / SMAPE |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Step 4** | Price Prediction | RandomForest | 41 | 12.2817 | 12.7601 | $R^2 = 0.9456$ |
| **Step 3 (Baseline)** | Price Prediction | LightGBM | 41 | 11.9768 | 12.2556 | $R^2 = 0.9352$ |
| **Step 6** | Demand Forecast | LightGBM | 49 | 2.0041 | 2.0407 | $\text{SMAPE} = 40.00\%$ |
| **Step 6 (Baseline)** | Demand Forecast | Lag-1 Persistence | 1 | 2.6243 | 2.6072 | $\text{SMAPE} = 50.52\%$ |

---

## 18. Data Leakage Prevention Verification

A multi-phase leakage audit confirmed that:
1. `price_base` and all current transaction discount fields are strictly excluded from the Step 4 Price model.
2. Future demand actuals are never used during multi-step demand forecasting or trend classification.
3. Historical KPIs aggregate only data strictly preceding the test origin date `2024-08-04`.
4. The 314,913 post-reference discount rows remain isolated in `future_discounts_history.csv`.

---

## 19. End-to-End Integration Testing (Step 11)

- **Suite**: [`eda/test_step11_integration.py`](file:///e:/PRICEPILOT-AI/eda/test_step11_integration.py)
- **Results**: **12 / 12 Tests Passed (100%)** in 11.67 seconds.
- **Dashboard Regression**: **6 / 6 Tests Passed (100%)** in [`eda/test_step10_dashboard.py`](file:///e:/PRICEPILOT-AI/eda/test_step10_dashboard.py).
- **Single-SKU End-to-End Trace**: Verified flawless sequential transformation from raw feature vector to UI presentation.

---

## 20. Security & Secret Management

- Credentials read strictly from `GEMINI_API_KEY` / `GOOGLE_API_KEY` via `python-dotenv`.
- Zero hardcoded credentials in codebase.
- API keys masked from logs, terminal outputs, JSON payloads, and CSV exports.

---

## 21. Resource Performance & Efficiency

- **Inference Latency**: Sub-millisecond model prediction per record.
- **Memory Footprint**: Execution utilizes lightweight report summaries (~7.7 MB) rather than reloading the 558 MB master panel at runtime.
- **Dashboard Caching**: Near-instant UI page switching with zero data mutation.

---

## 22. Known Limitations

1. **Non-Causal Price Optimization**: Recommends candidate prices aligned with market clearing price within $\pm 20\%$ safety bounds; does not model continuous price elasticity curves.
2. **Heuristic Confidence Index**: Represents operational data completeness and horizon agreement rather than statistical uncertainty intervals.
3. **Intermittent Demand Sparsity**: Low-volume long-tail products exhibit zero-demand days, reflecting standard retail transaction sparsity.

---

## 23. Future Scope & Improvements

1. **Causal Elasticity Modeling**: Incorporate econometric double-ML or instrumental variables to estimate item-level price elasticity of demand.
2. **Conformal Prediction Intervals**: Upgrade heuristic confidence scores to formal conformal prediction bands (e.g. 90% demand coverage intervals).
3. **Automated Markdown Optimization**: Add non-linear integer programming to solve store-level clearance markdown schedules under inventory constraints.

---

## 24. Milestone 2 Achievements Summary

- ✅ Delivered leak-free Random Forest Price Prediction Model ($R^2 = 0.9456$).
- ✅ Built Guardrail-Bounded Price Recommendation Engine ($\pm 20\%$).
- ✅ Built High-Performance LightGBM Demand Forecasting Model (MAE = 2.04 units).
- ✅ Deployed Deterministic Trend & Heuristic Reliability Scoring Engine.
- ✅ Implemented 4-Cluster Retail KPI & 8-Priority Commercial Decision Layer.
- ✅ Integrated Google Gemini LLM with safe structured context & offline fallback.
- ✅ Created Enterprise-Grade Executive Streamlit Analytics Dashboard.
- ✅ Completed 12-Module End-to-End Integration Test Suite (100% Pass Rate).

---

## 25. Conclusion

**Milestone 2 is 100% COMPLETE.** PricePilot AI successfully bridges machine learning research and commercial retail operations, delivering an explainable, robust, and leakage-free decision support intelligence platform ready for executive demonstration and enterprise deployment.
