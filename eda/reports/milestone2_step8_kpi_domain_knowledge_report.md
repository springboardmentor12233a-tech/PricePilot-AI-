# Milestone 2 Step 8 — KPI Extraction & Domain Knowledge Layer Report

**Project:** PricePilot AI  
**Milestone:** 2 — Predictive Modeling & Forecasting Setup  
**Step:** 8 — KPI Extraction & Domain Knowledge Layer  
**Script:** [`eda/extract_kpis.py`](file:///e:/PRICEPILOT-AI/eda/extract_kpis.py)  
**Date:** 2026-09-08 07:31  
**Status:** ✅ COMPLETE  

---

## 1. Objective

Create a reusable, leakage-safe commercial KPI extraction and domain knowledge layer that integrates:
$$\text{Demand Profiling} + \text{Pricing Intelligence} + \text{Promotional Impact} + \text{Revenue Tracking} + \text{Multi-Horizon Forecasting}$$
into explainable retail KPIs and decision-support priorities for external LLM consumption and operational dashboards.

---

## 2. Data Sources & Architecture

The KPI layer connects historical transactions, model predictions, recommendations, and trend classifications at the `(item_id, store_id)` granularity on the held-out test origin date `2024-08-04`:

| Data Layer | Source File / Artifact | Scope & Usage |
|:---|:---|:---|
| **Historical Pre-Test History** | `train_data.csv.gz` + `val_data.csv.gz` | 6.7M historical transactions (2022-08-28 → 2024-08-03) |
| **Pricing Prediction & Engine** | `models/price/rf_price_step4.joblib` | Step 4 RF model + Step 5 Candidate Recommendation Engine |
| **Demand Forecasting & Trends** | `models/demand/lgbm_demand_step6.txt` & Step 7 CSV | Step 6 Multi-Horizon LightGBM forecasts + Step 7 Trend Classifier |
| **Test Origin Active Panel** | `Datasets/processed/test_data.csv.gz` | 12,773 unique active item-store observations (2024-08-04) |

---

## 3. Required KPI Definitions & Calculation Methodology

### A. Demand KPIs
* **`hist_total_units`**: Sum of units sold across the historical pre-test period ($\sum \text{quantity}$).
* **`hist_avg_daily_demand`**: Mean daily sales units per item-store.
* **`hist_median_daily_demand`**: Median daily sales units.
* **`hist_max_daily_demand`**: Maximum peak historical daily sales units.
* **`hist_std_daily_demand`**: Standard deviation of daily demand volume.
* **`demand_trend`**: Step 7 trend trajectory (`INCREASING`, `STABLE`, `DECREASING`).
* **`forecast_7d_total` / `14d` / `30d`**: Cumulative forecasted demand across 7, 14, and 30-day forward horizons.

### B. Pricing KPIs
* **`hist_avg_price` / `median` / `min` / `max`**: Historical unit price distribution across actual transactions.
* **`reference_price` ($P_{ref}$)**: Baseline price established from pre-transaction lag features (`price_lag_1` / `price_roll_mean_7`).
* **`predicted_clearing_price` ($\hat{P}_{model}$)**: Step 4 Random Forest model expected transaction clearing price.
* **`recommended_price` ($P^*$)**: Step 5 candidate-selected price minimizing discrepancy from $\hat{P}_{model}$.
* **`price_change_pct`**: $\frac{P^* - P_{ref}}{P_{ref}} \times 100$.

### C. Promotion KPIs
* **`hist_promo_rate_pct`**: Percentage of historical days the item-store was on active discount.
* **`hist_avg_discount_pct`**: Mean percentage discount depth when on promotion.
* **`hist_avg_discount_amount`**: Average monetary discount amount per unit.
* **`hist_promo_demand_avg` vs `hist_non_promo_demand_avg`**: Average daily sales on promo days vs non-promo days.
* **`hist_promo_demand_lift_pct`**: Observed relative demand difference between promo and non-promo days (documented as correlation/association).

### D. Revenue KPIs
* **`hist_total_revenue`**: Sum of realized sales revenue ($\sum \text{valid\_price} \times \text{quantity} = \sum \text{sum\_total}$).
* **`hist_avg_daily_revenue`**: Average realized revenue generated per day.
* **`hist_revenue_per_unit`**: Realized revenue per unit sold.

### E. Forecast & Reliability KPIs
* **`change_pct_7d`**: Percentage difference between forecasted 7-day average demand and historical 7-day average.
* **`direction_consistency`**: Multi-horizon trajectory agreement (`FULL_CONSISTENCY`, `PARTIAL_CONSISTENCY`, `DIVERGENT`).
* **`confidence_score`**: 0–100 heuristic confidence score combining base model accuracy, consistency, volume, and margin.

---

## 4. Overall Project-Level KPI Summary

```json
{
  "total_observations": 12773,
  "total_historical_units_sold": 26076167.4,
  "total_historical_revenue": 3221404404.46,
  "overall_avg_daily_demand": 5.83,
  "overall_median_daily_demand": 2.0,
  "overall_avg_price": 214.66000366210938,
  "overall_avg_recommended_price": 213.75999450683594,
  "overall_avg_recommended_price_change_pct": 1.2699999809265137,
  "overall_promo_rate_pct": 21.03,
  "overall_avg_discount_pct": 3.7,
  "total_forecast_7d_units": 477428.14,
  "total_forecast_14d_units": 936042.94,
  "total_forecast_30d_units": 1958852.7,
  "increasing_trend_pct": 17.39,
  "stable_trend_pct": 12.8,
  "decreasing_trend_pct": 69.81,
  "average_confidence_score": 87.22,
  "median_confidence_score": 90.0,
  "priority_breakdown": {
    "PROMOTIONAL_STIMULATION_REVIEW": 7457,
    "STOCK_REPLENISHMENT_PRIORITY": 1805,
    "PRICING_MARKDOWN_REVIEW": 1405,
    "HUMAN_COMMERCIAL_REVIEW": 989,
    "STABLE_CORE_OPERATIONS": 714,
    "PRICE_INCREASE_OPPORTUNITY": 194,
    "STANDARD_MONITORING": 112,
    "PRICE_REDUCTION_RECOMMENDED": 97
  },
  "data_grain": "(item_id, store_id) across test origin date 2024-08-04"
}
```

### Executive KPI Highlights:
* **Total Item-Store Combinations Evaluated:** **12,773**
* **Total Historical Revenue Generated:** **$3,221,404,404.46** (26,076,167.4 total units sold)
* **Overall Average Daily Demand:** **5.83 units/day** (Median: 2.00)
* **Overall Average Reference Price:** **$214.66** $\rightarrow$ Recommended: **$213.76** (+1.3%)
* **Forward 7-Day Total Demand Forecast:** **477,428.1 units**
* **Forward 30-Day Total Demand Forecast:** **1,958,852.7 units**
* **Trend Distribution:** `17.39%` Increasing, `12.8%` Stable, `69.81%` Decreasing
* **Mean Confidence Score:** **`87.2 / 100`** (Median: `90.0`)

---

## 5. Domain Decision-Support Rules & Distribution

The domain rule engine maps multi-dimensional KPI vectors into commercial decision priorities:

| Business Priority Flag | Item-Store Count | Share | Primary Trigger Condition |
|:---|:---|:---|:---|
| `PROMOTIONAL_STIMULATION_REVIEW` | 7,457 | 58.4% |
| `STOCK_REPLENISHMENT_PRIORITY` | 1,805 | 14.1% |
| `PRICING_MARKDOWN_REVIEW` | 1,405 | 11.0% |
| `HUMAN_COMMERCIAL_REVIEW` | 989 | 7.7% |
| `STABLE_CORE_OPERATIONS` | 714 | 5.6% |
| `PRICE_INCREASE_OPPORTUNITY` | 194 | 1.5% |
| `STANDARD_MONITORING` | 112 | 0.9% |
| `PRICE_REDUCTION_RECOMMENDED` | 97 | 0.8% |

---

## 6. Sample KPI Records & Case Studies

| # | Item ID | Store | Class | Hist Avg Qty | Ref Price | Rec Price | 7D Forecast | Trend | Business Priority |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | `0022b986c8f0` | Store 1 | МОНОСПЕЦИИ | 2.2 | $83.90 | **$82.22** | **6.9** | **DECREASING** | `PROMOTIONAL_STIMULATION_REVIEW` |
| 2 | `002555e3c4fa` | Store 1 | ПРЯНИКИ | 4.9 | $84.35 | **$89.41** | **14.1** | **DECREASING** | `PROMOTIONAL_STIMULATION_REVIEW` |
| 3 | `002f51c34a7a` | Store 1 | ДЕСЕРТЫ | 3.2 | $82.20 | **$93.71** | **26.8** | **INCREASING** | `STOCK_REPLENISHMENT_PRIORITY` |
| 4 | `0033a62250ac` | Store 1 | ГОТОВЫЕ ЗАВТРАКИ | 1.3 | $109.90 | **$112.10** | **7.0** | **DECREASING** | `PROMOTIONAL_STIMULATION_REVIEW` |
| 5 | `005addd8096b` | Store 1 | ПЕЧЕНЬЕ | 2.3 | $59.90 | **$61.10** | **25.9** | **INCREASING** | `STOCK_REPLENISHMENT_PRIORITY` |
| 6 | `0062dbaa1e6e` | Store 1 | БУМАЖНАЯ ПРОДУКЦИЯ | 2.9 | $199.90 | **$203.90** | **29.4** | **INCREASING** | `STOCK_REPLENISHMENT_PRIORITY` |
| 7 | `00727e9b17f7` | Store 1 | ИКРА СЕЛЬДИ | 1.8 | $1371.82 | **$1371.82** | **12.2** | **INCREASING** | `STOCK_REPLENISHMENT_PRIORITY` |
| 8 | `00773a26d0f6` | Store 1 | ЛАПША БЫСТРОГО ПРИГОТОВЛЕНИЯ | 2.6 | $109.75 | **$109.75** | **21.6** | **INCREASING** | `HUMAN_COMMERCIAL_REVIEW` |
| 9 | `007ea45f8e2a` | Store 1 | ПРОЧИЕ РЫБНЫЕ КОНСЕРВЫ | 1.5 | $95.00 | **$96.90** | **8.3** | **DECREASING** | `PROMOTIONAL_STIMULATION_REVIEW` |
| 10 | `009788312f95` | Store 1 | СЫРКИ | 4.5 | $64.90 | **$62.30** | **13.3** | **DECREASING** | `PRICING_MARKDOWN_REVIEW` |


### Case Study 1: Item `0022b986c8f0` @ Store 1 (СПЕЦИИ,ПРИПРАВА / МОНОСПЕЦИИ)
* **Demand Profile**: Historical Avg `2.20 units/day` (Max: `9.0`, Total: `532.0` units).
* **Pricing & Recommendation**: Reference `$83.90` $\rightarrow$ Recommended **`$82.22`** (-2.0%).
* **Promotion & Revenue**: Promo Rate `17.4%` (Avg Discount: `3.4%`). Realized Revenue: `$32,280.89`.
* **Multi-Horizon Forecast**: 7-Day **`6.9 units`**, 14-Day **`13.6 units`**, 30-Day **`28.2 units`** $\rightarrow$ **`DECREASING`** (HIGH Confidence: `90.0/100`).
* **Commercial Decision Rule**: **`PROMOTIONAL_STIMULATION_REVIEW`**
* **Dynamic Domain Insight**:
  > Demand is projected to be DECREASING (-36.8% vs baseline, HIGH confidence of 90.0/100). Recommended price is $82.22 (-2.0% lower than reference price $83.90). Historical promotional days exhibited 38.7% higher observed average demand. Action: Review promotional campaigns and marketing stimulation to reverse declining sales trajectory.


### Case Study 2: Item `002555e3c4fa` @ Store 1 (СЛАДКИЕ МУЧНЫЕ ИЗДЕЛИЯ / ПРЯНИКИ)
* **Demand Profile**: Historical Avg `4.89 units/day` (Max: `22.0`, Total: `920.0` units).
* **Pricing & Recommendation**: Reference `$84.35` $\rightarrow$ Recommended **`$89.41`** (+6.0%).
* **Promotion & Revenue**: Promo Rate `33.5%` (Avg Discount: `0.0%`). Realized Revenue: `$89,922.78`.
* **Multi-Horizon Forecast**: 7-Day **`14.1 units`**, 14-Day **`27.7 units`**, 30-Day **`58.2 units`** $\rightarrow$ **`DECREASING`** (HIGH Confidence: `90.0/100`).
* **Commercial Decision Rule**: **`PROMOTIONAL_STIMULATION_REVIEW`**
* **Dynamic Domain Insight**:
  > Demand is projected to be DECREASING (-21.3% vs baseline, HIGH confidence of 90.0/100). Recommended price is $89.41 (+6.0% higher than reference price $84.35). Historical promotional days exhibited 55.3% higher observed average demand. Action: Review promotional campaigns and marketing stimulation to reverse declining sales trajectory.


### Case Study 3: Item `002f51c34a7a` @ Store 1 (СОВРЕМЕННАЯ МОЛОЧНАЯ КАТЕГОРИЯ / ДЕСЕРТЫ)
* **Demand Profile**: Historical Avg `3.18 units/day` (Max: `12.0`, Total: `1,449.0` units).
* **Pricing & Recommendation**: Reference `$82.20` $\rightarrow$ Recommended **`$93.71`** (+14.0%).
* **Promotion & Revenue**: Promo Rate `19.3%` (Avg Discount: `2.5%`). Realized Revenue: `$121,856.62`.
* **Multi-Horizon Forecast**: 7-Day **`26.8 units`**, 14-Day **`53.2 units`**, 30-Day **`112.5 units`** $\rightarrow$ **`INCREASING`** (HIGH Confidence: `90.0/100`).
* **Commercial Decision Rule**: **`STOCK_REPLENISHMENT_PRIORITY`**
* **Dynamic Domain Insight**:
  > Demand is projected to be INCREASING (+16.4% vs baseline, HIGH confidence of 90.0/100). Recommended price is $93.71 (+14.0% higher than reference price $82.20). Historical promotional days exhibited 11.2% higher observed average demand. Action: Prioritize inventory replenishment to capture rising demand and avoid stockouts.


---

## 7. Data Integrity & Leakage Verification

| Integrity Standard | Verification Method | Status |
|:---|:---|:---|
| **No Test Target Leakage** | All KPIs computed from pre-test history (train+val) or pre-transaction lags at origin date 2024-08-04. | ✅ **PASS** |
| **No Negative Values** | Quantities and revenues verified non-negative ($\ge 0.0$). | ✅ **PASS** |
| **No Divide-by-Zero / NaNs** | Safe epsilon denominators applied; verified 0 NaN / infinite values. | ✅ **PASS** |
| **Model Integrity** | Step 4 RF model, Step 5 engine, Step 6 LightGBM model, and Step 7 classifier preserved untouched. | ✅ **PASS** |
| **Grain Uniqueness** | Zero duplicate `(item_id, store_id)` keys across all 12,773 output records. | ✅ **PASS** |

---

## 8. Saved Artifacts

| Artifact | Type | File Path |
|:---|:---|:---|
| **KPI Pipeline Script** | Python Module & API | `eda/extract_kpis.py` |
| **Item-Store KPI Table** | CSV Dataset (12,773 rows) | `eda/reports/kpi_summary.csv` |
| **Overall Summary Metrics** | JSON Payload | `eda/reports/kpi_overall_summary.json` |
| **Milestone 2 Step 8 Report** | Markdown Document | `eda/reports/milestone2_step8_kpi_domain_knowledge_report.md` |

---
*Report generated by `eda/extract_kpis.py` — PricePilot AI Milestone 2 Step 8*
