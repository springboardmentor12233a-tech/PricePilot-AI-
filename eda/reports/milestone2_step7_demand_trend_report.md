# Milestone 2 Step 7 — Demand Trend Classification Report

**Project:** PricePilot AI  
**Milestone:** 2 — Predictive Modeling & Forecasting Setup  
**Step:** 7 — Demand Trend Classification  
**Script:** [`eda/classify_demand_trends.py`](file:///e:/PRICEPILOT-AI/eda/classify_demand_trends.py)  
**Date:** 2026-09-08 07:21  
**Status:** ✅ COMPLETE  

---

## 1. Objective

Build a standalone, explainable, and deterministic **Demand Trend Classification** pipeline that converts raw continuous unit demand forecasts (from Step 6) into standardized commercial demand trajectories (`INCREASING`, `STABLE`, `DECREASING`), supported by multi-horizon trajectory consistency validation and an interpretable 0–100 heuristic confidence score.

---

## 2. Methodology & Thresholds

### 2.1 Primary 7-Day Trend Classification
The primary business comparison is established between the historical 7-day average sales volume and the model-forecasted 7-day average sales volume:

$$\text{trend\_change\_pct} = \frac{\text{forecast\_avg\_7d} - \text{historical\_avg\_7d}}{\max(\text{historical\_avg\_7d}, \epsilon)} \times 100$$

Where $\epsilon = 0.10$ prevents numerical division-by-zero on low-volume items.

```
• trend_change_pct > +5.0%        ──> INCREASING
• -5.0% <= trend_change_pct <= +5.0% ──> STABLE
• trend_change_pct < -5.0%        ──> DECREASING
```

### 2.2 Multi-Horizon Trajectory Consistency
To ensure robust operational decisions, the 14-day and 30-day forecast horizons are evaluated alongside the 7-day horizon:
* **`FULL_CONSISTENCY` (3/3 agree)**: 7-day, 14-day, and 30-day horizons point in the identical direction.
* **`PARTIAL_CONSISTENCY` (2/3 agree)**: 2 horizons align with the 7-day direction.
* **`DIVERGENT`**: Horizon projections conflict (e.g., short-term promotional spike vs medium-term return to baseline).

> [!IMPORTANT]
> The primary 7-day operational classification is strictly preserved and never silently overwritten by longer horizons.

---

## 3. Interpretable Heuristic Confidence Score (0–100)

Because this metric represents an operational quality score rather than a scientifically calibrated statistical probability, it is explicitly defined as a **heuristic confidence score**:

$$\text{Confidence} = \text{clip}(S_{\text{base}} + S_{\text{consistency}} + S_{\text{stability}} + S_{\text{margin}}, 0, 100)$$

| Component | Weight | Criteria & Score Allocation |
|:---|:---|:---|
| **Base Model Reliability** | **25 pts** | Constant base credit from Step 6 LightGBM validated generalization performance. |
| **Multi-Horizon Consistency** | **30 pts** | `FULL_CONSISTENCY`: **+30 pts** <br> `PARTIAL_CONSISTENCY`: **+18 pts** <br> `DIVERGENT`: **+5 pts** |
| **Historical Volume & Stability** | **25 pts** | $\ge 10$ units/day: **+25 pts** <br> $3.0 - 10.0$ units/day: **+20 pts** <br> $1.0 - 3.0$ units/day: **+15 pts** <br> $< 1.0$ units/day: **+5-10 pts** |
| **Signal Decisiveness Margin** | **20 pts** | Decisive movement ($|\Delta| \ge 20\%$ or $|\Delta| \le 1.5\%$ for STABLE): **+20 pts** <br> Moderate delta ($|\Delta| \ge 10\%$): **+15 pts** <br> Borderline threshold edge ($4.0\% - 6.0\%$): **+5 pts** |

---

## 4. Summary Classification Statistics

Total Item-Store Combinations Classified: **12,773** (Origin Date: `2024-08-04`)

| Trend Category | Item-Store Count | Percentage |
|:---|:---|:---|
| **`INCREASING`** | **2,221** | **17.4%** |
| **`STABLE`** | **1,635** | **12.8%** |
| **`DECREASING`** | **8,917** | **69.8%** |
| **Total** | **12,773** | **100.0%** |

### 4.1 Confidence Score Distribution

* **Mean Confidence Score:** **`87.2 / 100`**
* **Median Confidence Score:** **`90.0 / 100`**
* **High Confidence ($\ge 75$ pts):** `11,515` (90.2%)
* **Medium Confidence ($50 - 74$ pts):** `1,245` (9.8%)
* **Low Confidence ($< 50$ pts):** `13` (0.1%)

### 4.2 Multi-Horizon Consistency Distribution

* **Full Consistency (3/3 agree):** `11,185` (87.6%)
* **Partial Consistency (2/3 agree):** `599` (4.7%)
* **Divergent Horizons:** `989` (7.7%)

---

## 5. Representative Case Studies

| # | Item ID | Store | Category | Hist 7D | Fcst 7D | $\Delta 7\text{d}\%$ | Trend | Consistency | Confidence |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | `0022b986c8f0` | Store 1 | МОНОСПЕЦИИ | 1.57 | 0.99 | -36.8% | **DECREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 2 | `002555e3c4fa` | Store 1 | ПРЯНИКИ | 2.57 | 2.02 | -21.3% | **DECREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 3 | `002f51c34a7a` | Store 1 | ДЕСЕРТЫ | 3.29 | 3.83 | +16.4% | **INCREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 4 | `0033a62250ac` | Store 1 | ГОТОВЫЕ ЗАВТРАКИ | 1.14 | 1.00 | -12.5% | **DECREASING** | FULL_CONSISTENCY | **85.0** (HIGH) |
| 5 | `005addd8096b` | Store 1 | ПЕЧЕНЬЕ | 2.14 | 3.70 | +72.5% | **INCREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 6 | `0062dbaa1e6e` | Store 1 | БУМАЖНАЯ ПРОДУКЦИЯ | 2.86 | 4.20 | +46.9% | **INCREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 7 | `00727e9b17f7` | Store 1 | ИКРА СЕЛЬДИ | 1.36 | 1.75 | +28.4% | **INCREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 8 | `00773a26d0f6` | Store 1 | ЛАПША БЫСТРОГО ПРИГОТОВЛЕНИЯ | 2.86 | 3.08 | +7.8% | **INCREASING** | DIVERGENT | **55.0** (MEDIUM) |
| 9 | `007ea45f8e2a` | Store 1 | ПРОЧИЕ РЫБНЫЕ КОНСЕРВЫ | 2.00 | 1.19 | -40.5% | **DECREASING** | FULL_CONSISTENCY | **90.0** (HIGH) |
| 10 | `009788312f95` | Store 1 | СЫРКИ | 3.00 | 1.90 | -36.8% | **DECREASING** | FULL_CONSISTENCY | **95.0** (HIGH) |
| 11 | `00aa37841bff` | Store 1 | ТЕСТО | 2.43 | 2.83 | +16.4% | **INCREASING** | FULL_CONSISTENCY | **85.0** (HIGH) |
| 12 | `00b50d9ec10d` | Store 1 | ДЕТСКИЕ ПРОДУКТЫ ДО 3-Х ЛЕТ | 3.14 | 2.39 | -24.1% | **DECREASING** | FULL_CONSISTENCY | **95.0** (HIGH) |


### Case Study 1: Item `0022b986c8f0` @ Store 1 (СПЕЦИИ,ПРИПРАВА / МОНОСПЕЦИИ)
* **Historical Baseline (7-day avg)**: `1.57 units/day`
* **Forecasted Daily Averages**:
  - 7-Day: `0.99 units/day` (-36.8%) $\rightarrow$ **`DECREASING`**
  - 14-Day: `0.97 units/day` (-38.4%) $\rightarrow$ `DECREASING`
  - 30-Day: `0.94 units/day` (-40.0%) $\rightarrow$ `DECREASING`
* **Multi-Horizon Trajectory**: `FULL_CONSISTENCY`
* **Confidence Score**: **`90.0 / 100`** (`HIGH`)
* **Rationale & Explanation**:
  > Demand projected to be DECREASING (-36.8% vs 7d historical avg of 1.57 units/day, moving to 0.99 units/day). Multi-horizon consistency is FULL_CONSISTENCY (14d: -38.4%, 30d: -40.0%). Confidence: 90.0/100 (HIGH).


### Case Study 2: Item `002555e3c4fa` @ Store 1 (СЛАДКИЕ МУЧНЫЕ ИЗДЕЛИЯ / ПРЯНИКИ)
* **Historical Baseline (7-day avg)**: `2.57 units/day`
* **Forecasted Daily Averages**:
  - 7-Day: `2.02 units/day` (-21.3%) $\rightarrow$ **`DECREASING`**
  - 14-Day: `1.98 units/day` (-23.2%) $\rightarrow$ `DECREASING`
  - 30-Day: `1.94 units/day` (-24.5%) $\rightarrow$ `DECREASING`
* **Multi-Horizon Trajectory**: `FULL_CONSISTENCY`
* **Confidence Score**: **`90.0 / 100`** (`HIGH`)
* **Rationale & Explanation**:
  > Demand projected to be DECREASING (-21.3% vs 7d historical avg of 2.57 units/day, moving to 2.02 units/day). Multi-horizon consistency is FULL_CONSISTENCY (14d: -23.2%, 30d: -24.5%). Confidence: 90.0/100 (HIGH).


### Case Study 3: Item `002f51c34a7a` @ Store 1 (СОВРЕМЕННАЯ МОЛОЧНАЯ КАТЕГОРИЯ / ДЕСЕРТЫ)
* **Historical Baseline (7-day avg)**: `3.29 units/day`
* **Forecasted Daily Averages**:
  - 7-Day: `3.83 units/day` (+16.4%) $\rightarrow$ **`INCREASING`**
  - 14-Day: `3.80 units/day` (+15.6%) $\rightarrow$ `INCREASING`
  - 30-Day: `3.75 units/day` (+14.0%) $\rightarrow$ `INCREASING`
* **Multi-Horizon Trajectory**: `FULL_CONSISTENCY`
* **Confidence Score**: **`90.0 / 100`** (`HIGH`)
* **Rationale & Explanation**:
  > Demand projected to be INCREASING (+16.4% vs 7d historical avg of 3.29 units/day, moving to 3.83 units/day). Multi-horizon consistency is FULL_CONSISTENCY (14d: +15.6%, 30d: +14.0%). Confidence: 90.0/100 (HIGH).


---

## 6. Edge Case Handling & Audit

| Edge Case Scenario | Handling Method | Records Handled |
|:---|:---|:---|
| **Zero Historical Demand** | Set to +100% (if forecast positive) or STABLE (if inactive); confidence dampened. | `32` |
| **Low-Volume Items ($< 0.1$ units/day)** | Minimum denominator floor $\epsilon = 0.10$ applied to avoid percentage explosion. | `0` |
| **Negative Forecasts** | Hard-clipped at $0.0$ units/day (non-negative physical inventory constraint). | 0 (0.0%) |
| **Missing Identifiers / NaNs** | Verified $0$ missing records; 100% complete deterministic outputs. | 0 (0.0%) |

---

## 7. Data Leakage & Integrity Verification

| Verification Check | Standard | Result |
|:---|:---|:---|
| **No Test Target Leakage** | Future actual demand from the test period is strictly excluded. | ✅ **PASS** |
| **Pre-Transaction Origin Date** | All classifications anchor to origin date `2024-08-04` using pre-known history. | ✅ **PASS** |
| **Step 6 Demand Model Untouched** | `models/demand/lgbm_demand_step6.txt` reused without retraining. | ✅ **PASS** |
| **Step 4 & 5 Models Untouched** | Price prediction and recommendation artifacts preserved intact. | ✅ **PASS** |

---

## 8. Saved Artifacts

| Artifact | File Type | Path |
|:---|:---|:---|
| **Trend Classification Script** | Python Module & API | `eda/classify_demand_trends.py` |
| **Classification Dataset** | CSV Dataset | `eda/reports/demand_trend_classification.csv` |
| **Summary Metrics Payload** | JSON Summary | `eda/reports/demand_trend_summary.json` |
| **Milestone Report** | Markdown Document | `eda/reports/milestone2_step7_demand_trend_report.md` |

---
*Report generated by `eda/classify_demand_trends.py` — PricePilot AI Milestone 2 Step 7*
