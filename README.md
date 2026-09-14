# PricePilot AI
## Dynamic Pricing Optimization & Revenue Intelligence System

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Framework-Streamlit](https://img.shields.io/badge/UI-Streamlit-FF4B4B.svg)](https://streamlit.io/)
[![ML-LightGBM_Scikit--Learn](https://img.shields.io/badge/ML-LightGBM%20%7C%20Scikit--Learn-brightgreen.svg)](https://scikit-learn.org/)
[![LLM-Google_Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-8E75B2.svg)](https://ai.google.dev/)
[![Testing-100%_Pass](https://img.shields.io/badge/Tests-12%2F12%20Passed-success.svg)](file:///e:/PRICEPILOT-AI/eda/test_step11_integration.py)

---

## 1. Project Overview

**PricePilot AI** is an enterprise-grade, end-to-end Machine Learning and Decision Support Intelligence platform designed for retail and e-commerce enterprises. The system unifies leakage-safe transaction price prediction, multi-horizon customer demand forecasting, deterministic demand trend classification, commercial retail KPI extraction, and automated Google Gemini LLM executive synthesis into an interactive visual dashboard.

The platform addresses core retail challenges: establishing competitive, data-driven catalog prices, forecasting product replenishment volumes across short (7-day), medium (14-day), and extended (30-day) horizons, and translating complex mathematical model outputs into actionable commercial directives.

---

## 2. Business Problem

Retail pricing and inventory management across multi-store operations face major operational bottlenecks:
- **Margin Erosion & Inelastic Pricing**: Inconsistent pricing rules lead to lost revenue margin on inelastic goods and inventory stagnation on price-sensitive products.
- **Demand Volatility**: Static rolling averages fail to capture complex weekly calendar seasonality, promotional lift spikes, and emerging catalog trends.
- **Cognitive Overload**: Category managers cannot manually analyze regression models across tens of thousands of individual SKUs.
- **Contemporaneous Data Leakage**: Standard retail models frequently suffer from training leakage (e.g., using contemporaneous transaction discounts to predict prices), causing severe operational failure during live forward execution.

---

## 3. Project Objectives

1. **Leakage-Safe Modeling**: Build strictly isolated predictive pipelines using historical lag features, calendar harmonics, and store metadata without future-looking data leakage.
2. **Fair Clearing Price Prediction**: Train machine learning models to estimate equilibrium market transaction clearing prices.
3. **Guardrail-Bounded Price Recommendations**: Provide discrete candidate price recommendations bounded within $\pm 20\%$ safety guardrails to align with market pricing equilibrium.
4. **Multi-Horizon Demand Forecasting**: Generate 7-day, 14-day, and 30-day forward demand projections to support weekly ordering and monthly supply chain planning.
5. **Demand Trajectory & Confidence Scoring**: Classify demand momentum (`Increasing`, `Stable`, `Decreasing`) and compute an interpretable 0–100 heuristic reliability index.
6. **Executive Decision Support**: Deliver automated Gemini AI executive briefings and an interactive analytics dashboard.

---

## 4. Key Features

- 🏷️ **Equilibrium Price Prediction**: Random Forest regressor with 41 leakage-free features achieving $R^2 = 0.9456$ on held-out test data.
- 🎯 **Rule-Bounded Candidate Engine**: Evaluates discrete price points within $\pm 20\%$ commercial boundaries to minimize discrepancy against predicted market clearing prices.
- 📈 **Multi-Horizon Demand Forecasting**: LightGBM GBDT regressor producing non-negative, cumulative monotonic demand forecasts across 7, 14, and 30 days.
- 🧭 **Deterministic Trend & Confidence Engine**: Identifies demand trajectory with a 5% margin and scores forecast reliability via a 4-part heuristic index (Average: 87.2/100).
- 💼 **Retail KPI & Domain Knowledge Layer**: Tracks 4 KPI clusters (Demand, Pricing, Promotion, Revenue) and maps observations to 8 strategic commercial priorities.
- 🤖 **Google Gemini LLM Insights Engine**: Structured prompt orchestration converting ML outputs into executive summaries and operational risks with deterministic offline fallback.
- 📊 **Executive Analytics Dashboard**: Modern Streamlit application featuring comprehensive English translations for 167 departments, multi-variable bubble charts, and single-SKU deep dives.

---

## 5. Technology Stack

- **Core & Runtime**: Python 3.10+, NumPy, Pandas
- **Machine Learning**: Scikit-Learn 1.9.0, LightGBM 4.7.0, Joblib
- **Visualization & UI**: Streamlit, Plotly Express, Plotly Graph Objects
- **Generative AI**: Official Google GenAI SDK (`google-genai`), Python-Dotenv
- **Testing & Verification**: Py_Compile, Unittest / Custom Integration Test Suite

---

## 6. Project Architecture

```
PRICEPILOT-AI/
├── Datasets/
│   ├── raw/                              # Original source CSV files (read-only)
│   └── processed/                        # Cleaned data & 558MB modeling master panel
├── models/
│   ├── price/                            # Price prediction models (Random Forest, Ridge, Meta)
│   └── demand/                           # Demand forecasting models (LightGBM, Ridge, Meta)
├── eda/
│   ├── recommend_price.py                # Step 5: Price recommendation engine
│   ├── train_step6_demand.py             # Step 6: Multi-horizon demand forecasting
│   ├── classify_demand_trends.py         # Step 7: Demand trend & confidence classification
│   ├── extract_kpis.py                   # Step 8: Retail KPI & domain rules extraction
│   ├── gemini_business_insights.py       # Step 9: Gemini LLM API integration module
│   ├── dashboard.py                      # Step 10/10A: Streamlit visualization dashboard
│   ├── test_step10_dashboard.py          # Dashboard validation test suite
│   ├── test_step11_integration.py        # Step 11: End-to-end integration test suite
│   └── reports/                          # Structured markdown reports and JSON/CSV artifacts
├── run_dashboard.py                      # Production dashboard launcher
└── README.md                             # Root project documentation
```

---

## 7. Dataset Overview

The project is built upon a multi-store retail dataset comprising 9 relational tables:

| Dataset File | Rows | Columns | Description |
| :--- | :---: | :---: | :--- |
| `ecommerce_sales_34500.csv` | 7,432,685 | 6 | Master daily transaction log across item-store pairs |
| `sales.csv` | 3,746,744 | 8 | Physical retail transaction sales records |
| `cleaned_discounts_history.csv` | 3,431,831 | 9 | Cleaned historical promotional discounts and codes |
| `online.csv` | 698,626 | 5 | E-commerce channel catalog listings and online pricing |
| `catalog.csv` | 219,810 | 8 | Product hierarchy metadata (Department, Class, Subclass) |
| `price_history.csv` | 8,979 | 6 | Historical base price adjustment events |
| `markdowns.csv` | 2,800 | 10 | Retail clearance markdown records |
| `stores.csv` | 4 | 5 | Physical store metadata (Format, City, Square Area) |
| `future_discounts_history.csv` | 314,913 | 9 | Isolated future-dated promotional records (2024–2045) |

---

## 8. Milestone 1 — Data Understanding & Exploratory Data Analysis

Milestone 1 established data hygiene, structural validation, and modeling panel preparation:

- **Dataset Inventory & Quality Validation**: Verified schemas, data types, missing value rates, and statistical cardinality across all 9 raw files.
- **Duplicate Analysis**: Confirmed zero duplicate primary keys at the transaction grain.
- **Foreign-Key Validation**: Validated relational integrity between `sales.csv`, `catalog.csv`, `stores.csv`, and `discounts_history.csv`.
- **Temporal Anomaly Detection & Resolution**: Audited `discounts_history.csv` and identified 314,913 records dated between 2024-09-27 and 2045-12-31. To eliminate future-looking temporal leakage, these rows were isolated into `future_discounts_history.csv`, creating `cleaned_discounts_history.csv` strictly aligned with observed sales (2022-08-28 to 2024-09-26).
- **Sales & Promotion EDA**: Analyzed discount depth distributions, price elasticity indicators, and store sales velocity.
- **Master Modeling Panel Preparation**: Constructed the full 7.43M row modeling dataset (`Datasets/processed/modeling_master_panel.csv.gz`, 558 MB) with zero forward leakage.

---

## 9. Milestone 2 — Machine Learning & Intelligence Layer

Milestone 2 operationalizes predictive modeling, business rules, LLM synthesis, and dashboard analytics:

### 9.1 Chronological Splits (Zero Random Leakage)
- **Train Set**: `2022-08-28` to `2024-06-09` (5,947,712 rows, 652 days)
- **Validation Set**: `2024-06-10` to `2024-08-03` (750,333 rows, 55 days)
- **Test Set**: `2024-08-04` to `2024-09-26` (734,640 rows, 54 days)

### 9.2 Step 4: Price Prediction Model
- Trained a **Random Forest Regressor** on 41 clean features (33 numerical, 8 categorical).
- Excluded contemporaneous transaction fields (`price_base`, `sale_price_before_promo`, `sale_price_time_promo`, `online_price`, `promo_discount_amount`, `promo_discount_pct`).
- **Validation MAE**: `12.2817` ($R^2 = 0.9484$) | **Test MAE**: `12.7601` ($R^2 = 0.9456$).

### 9.3 Step 5: Price Recommendation Engine
- Evaluates candidate prices in discrete steps within $[P_{\text{ref}} \times 0.80, P_{\text{ref}} \times 1.20]$.
- Recommends target price $P^*$ minimizing absolute discrepancy $|P - P_{\text{model}}|$ to respect commercial guardrails.
- *Methodology Note: Represents model-alignment decision support bounded by guardrails; not causal revenue optimization.*

### 9.4 Step 6: Multi-Horizon Demand Forecasting
- Trained a **LightGBM GBDT Regressor** on 49 features using direct `regression_l1` (MAE) optimization.
- Generates rolling autoregressive predictions across 7-day, 14-day, and 30-day horizons.
- **Test MAE**: `2.0407 units` (outperforms Lag-1 persistence baseline of 2.6072 by **21.7%**).

### 9.5 Step 7: Demand Trend & Reliability Scoring
- Classifies 7-day demand pace change: `Increasing` ($> +5\%$), `Stable` ($\pm 5\%$), `Decreasing` ($< -5\%$).
- Portfolio Distribution: Decreasing (69.81%), Increasing (17.39%), Stable (12.80%).
- Computes a 4-part **heuristic confidence score** bounded in $[0, 100]$ (Average: **87.2 / 100**).
- *Methodology Note: Represents an operational reliability index; not a calibrated statistical probability.*

### 9.6 Step 8: Retail KPI & Domain Knowledge Layer
- Aggregates Demand, Pricing, Promotion, and Revenue KPIs across 12,773 item-store observations.
- Assigns 8 commercial action directives (e.g. `Promotional Stimulation Review`, `Pricing Markdown Review`).

### 9.7 Step 9: Gemini LLM Business Insights Engine
- Integrates Google's Gemini API via structured business context payloads.
- Generates 6-part executive briefings (Summary, Rationale, Demand, Promo, Risks, Directives).
- Secure credential management with deterministic offline fallback mode.

### 9.8 Step 10 & 10A: Presentation Dashboard
- Enterprise-grade Streamlit application free of internal development milestone jargon.
- Complete presentation mapping covering all 167 Russian grocery departments to clear English terms.
- 6 intuitive business tabs with sub-second initialization.

### 9.9 Step 11: End-to-End Pipeline Validation
- Automated 12-module test suite ([`eda/test_step11_integration.py`](file:///e:/PRICEPILOT-AI/eda/test_step11_integration.py)) passing with 100% success.
- Verified zero mutations to raw datasets or ML model artifacts.

---

## 10. Model Performance Summary

| Pipeline Component | Task | Model Architecture | Features | Val MAE | Test MAE | Test Score |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Price Model (Step 4)** | Equilibrium Price | Random Forest | 41 | 12.2817 | 12.7601 | $R^2 = 0.9456$ |
| **Price Model Baseline** | Equilibrium Price | LightGBM (Step 3) | 41 | 11.9768 | 12.2556 | $R^2 = 0.9352$ |
| **Demand Model (Step 6)** | Unit Sales Forecast | LightGBM GBDT | 49 | 2.0041 | 2.0407 | $\text{SMAPE} = 40.00\%$ |
| **Demand Baseline** | Unit Sales Forecast | Lag-1 Persistence | 1 | 2.6243 | 2.6072 | $\text{SMAPE} = 50.52\%$ |

---

## 11. Key Project Artifacts & Reports

| Milestone Step | Primary Script | Core Output Artifact | Summary Report |
| :--- | :--- | :--- | :--- |
| **Data Prep** | `eda/prepare_modeling_data.py` | `modeling_master_panel.csv.gz` | [`milestone2_step2_modeling_preparation_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step2_modeling_preparation_report.md) |
| **Leakage Audit** | `eda/retrain_price_corrected.py` | `leakage_audit_report.csv` | [`milestone2_step3_leakage_audit.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step3_leakage_audit.md) |
| **Price Model** | `eda/train_step4_price.py` | `models/price/rf_price_step4.joblib` | [`milestone2_step4_price_prediction_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step4_price_prediction_report.md) |
| **Price Rec Engine** | `eda/recommend_price.py` | `price_recommendation_examples.csv` | [`milestone2_step5_price_recommendation_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step5_price_recommendation_report.md) |
| **Demand Forecast** | `eda/train_step6_demand.py` | `models/demand/lgbm_demand_step6.txt` | [`milestone2_step6_demand_forecasting_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step6_demand_forecasting_report.md) |
| **Trend & Confidence**| `eda/classify_demand_trends.py`| `demand_trend_classification.csv` | [`milestone2_step7_demand_trend_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step7_demand_trend_report.md) |
| **KPI Domain Layer** | `eda/extract_kpis.py` | `kpi_summary.csv` | [`milestone2_step8_kpi_domain_knowledge_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step8_kpi_domain_knowledge_report.md) |
| **Gemini AI Insights**| `eda/gemini_business_insights.py`| `gemini_business_insight_examples.json` | [`milestone2_step9_gemini_llm_integration_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step9_gemini_llm_integration_report.md) |
| **Dashboard UI** | `eda/dashboard.py` | `run_dashboard.py` | [`milestone2_step10_dashboard_refinement_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step10_dashboard_refinement_report.md) |
| **Integration Suite** | `eda/test_step11_integration.py`| Test Logs (12/12 Passed) | [`milestone2_step11_integration_testing_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_step11_integration_testing_report.md) |
| **Final Milestone 2** | Full Pipeline | Unified Artifacts | [`milestone2_final_report.md`](file:///e:/PRICEPILOT-AI/eda/reports/milestone2_final_report.md) |

---

## 12. Dashboard Overview

The executive dashboard ([`eda/dashboard.py`](file:///e:/PRICEPILOT-AI/eda/dashboard.py)) is structured into 6 commercial decision sections:

1. 📊 **Executive Overview**: Portfolio-level revenue, unit volumes, baseline prices, average recommended deltas, priority mix, and department bubble landscape.
2. 🏷️ **Price Optimization**: Single-SKU candidate price comparison benchmark, historical range gauge, and department-wide price delta distribution.
3. 📈 **Demand Forecast**: 7-day, 14-day, and 30-day volume projections, cumulative pace vs historical baseline, and portfolio reliability distributions.
4. 💼 **Business Performance**: 4 structured metric cards (Demand, Pricing, Promotion, Revenue) and domain strategic action directives.
5. 🤖 **AI Business Insights**: Executive Gemini briefing detailing pricing rationale, demand dynamics, operational risks, and recommended directives.
6. 🔍 **Product Deep Dive**: Consolidated 360-degree SKU view with metadata, price grid breakdown, and multi-horizon forecast tables.

---

## 13. How to Run the Project

### 13.1 Installation & Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/springboardmentor12233a-tech/PricePilot-AI-.git
cd PricePilot-AI-
pip install -r requirements.txt
```

### 13.2 Execute Integration Test Suites
Run the centralized integration test suite:
```bash
python eda/test_step11_integration.py
```
Run the dashboard test suite:
```bash
python eda/test_step10_dashboard.py
```

### 13.3 Launch the Analytics Dashboard
Launch via the production launcher:
```bash
python run_dashboard.py --port 8501
```
Or directly via Streamlit:
```bash
streamlit run eda/dashboard.py --server.port 8501
```
Navigate to `http://localhost:8501` in your browser.

---

## 14. Security & API Key Setup

The project supports optional live Google Gemini LLM API generation. To configure:
1. Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   GEMINI_MODEL="gemini-2.5-flash"
   ```
2. The engine safely loads credentials at runtime via `python-dotenv`.
3. If no key is configured, the system automatically and safely operates in **verified offline fallback mode** using pre-computed executive briefings. Zero credentials are hardcoded or exposed.

---

## 15. Limitations & Scope Boundaries

1. **Model-Alignment Recommendation vs Causal Optimization**: The price recommendation engine aligns prices with predicted fair clearing price within $\pm 20\%$ safety bounds. It does **not** estimate econometric price elasticity curves or perform continuous non-linear profit optimization.
2. **Heuristic Confidence Index**: The confidence score is an operational data completeness and horizon agreement index, **not a calibrated Bayesian or statistical probability**.
3. **Sparse Long-Tail Demand**: Low-velocity retail products naturally exhibit intermittent zero-sales transactions, reflected in portfolio SMAPE.
4. **Gemini Live Testing Notice**: Live Gemini API testing was not performed during development testing due to absent live API credentials; the deterministic offline fallback was fully verified.

---

## 16. Future Scope

- **Causal Double-ML Elasticity Estimation**: Incorporate econometric instrumental variables to estimate individual product price elasticity curves.
- **Conformal Prediction Intervals**: Upgrade heuristic confidence scores to formal conformal prediction uncertainty bands (e.g. 90% demand coverage).
- **Constrained Markdown Optimizer**: Implement integer programming algorithms for multi-period store clearance markdown schedules under inventory constraints.

---

## 17. Current Project Status

- **Milestone 1 (Data Understanding & EDA)**: ✅ **COMPLETE**
- **Milestone 2 (Predictive Modeling & Intelligence Setup)**: ✅ **COMPLETE**
- **Integration Test Status**: ✅ **12 / 12 Tests Passed (100%)**
- **Dashboard Status**: ✅ **Production-Ready at `http://localhost:8501`**