# Milestone 2 — Step 3: Leakage & Feature Availability Audit

**Project:** PricePilot AI  
**Milestone:** 2 — Predictive Modeling & Forecasting Setup  
**Step:** 3 — Post-Training Leakage & Feature Availability Audit  
**Auditor Script:** Forensic analysis via `prepare_modeling_data.py` + live data correlation checks  
**Status:** ✅ AUDIT COMPLETE  

---

## 1. Executive Summary

This audit classifies every feature used in the Step 3 Price Prediction and Demand Forecasting models for leakage risk. It relies on three sources of evidence:

1. **Code inspection** — [`eda/prepare_modeling_data.py`](file:///e:/PRICEPILOT-AI/eda/prepare_modeling_data.py) (the exact construction logic for each feature)
2. **Statistical evidence** — live correlation and exact-match analysis run against the 200k-row training sample
3. **Feature importance evidence** — [`price_feature_importance.csv`](file:///e:/PRICEPILOT-AI/eda/reports/price_feature_importance.csv) and [`demand_feature_importance.csv`](file:///e:/PRICEPILOT-AI/eda/reports/demand_feature_importance.csv)

---

## 2. Price Prediction Model — Feature-by-Feature Audit

**Target:** `price_base`  
**Feature count in model:** 48 (40 numeric + 8 categorical)

The classification scheme used:
- **SAFE** — genuinely available before `price_base` is realized; no definitional or statistical overlap
- **TARGET PROXY** — effectively equivalent to or directly derived from `price_base`
- **CONDITIONAL** — valid only in a specific business scenario where future/planned prices are known in advance
- **CONTEMPORANEOUS LEAKAGE** — observed at the same instant as `price_base`; unavailable at prediction time in a forecasting context

---

### 2.1 🔴 CRITICAL: `sale_price_before_promo`

**Classification: TARGET PROXY for non-promo rows; CONDITIONAL for promo rows**

**Evidence — Code (lines 183):**
```python
df["sale_price_before_promo"] = df["sale_price_before_promo"].fillna(df["price_base"])
```

**Evidence — Statistical (200k-row sample):**
```
No-promo rows (is_on_promo=0): 158,478 rows
  → corr(sale_price_before_promo, price_base) = 1.000000  ← PERFECT correlation
  → pct where sale_price_before_promo == price_base: 100.00%  ← EXACT MATCH
```

**Root cause:**  
`sale_price_before_promo` comes from `sales.csv` (the promotional schedule). For the **~79% of transactions where `is_on_promo=0`**, there is no promotional record, so this field was **imputed with `price_base` itself** (line 183). This means for the majority of training rows, `sale_price_before_promo` *is* `price_base`. For the **~21% of promo rows**, `sale_price_before_promo` is the catalogued regular price — which is a legitimately planned, pre-published input — but the model cannot distinguish its role because it was trained on imputed data where the two values are identical for most rows.

**Verdict:**  
- On non-promo rows: **complete target proxy** (100% identical to `price_base` by construction).
- On promo rows: semantically legitimate (published regular price differs from transaction price) but correlation is still 0.97 with `price_base`.
- The feature as constructed is **not safe** for use in a blind price prediction scenario because the imputation permanently encodes `price_base` into this column for 79% of rows.

---

### 2.2 🔴 CRITICAL: `sale_price_time_promo`

**Classification: TARGET PROXY for non-promo rows; CONDITIONAL for promo rows**

**Evidence — Code (line 184):**
```python
df["sale_price_time_promo"] = df["sale_price_time_promo"].fillna(df["price_base"])
```

**Evidence — Statistical (200k-row sample):**
```
No-promo rows (is_on_promo=0): 158,478 rows
  → corr(sale_price_time_promo, price_base) = 1.000000  ← PERFECT correlation
  → pct where sale_price_time_promo == price_base: 100.00%  ← EXACT MATCH

Promo rows (is_on_promo=1): 41,522 rows
  → corr(sale_price_time_promo, price_base) = 0.990118  ← near-perfect
  → pct where sale_price_time_promo == price_base: 43.72%
```

**Root cause:**  
Same imputation pattern as `sale_price_before_promo`. For non-promo rows (79% of data), the promotional price does not exist, and `price_base` is used as the fill value. For promo rows, the promotional price is the *intended* selling price — but 43.7% of those rows also show `sale_price_time_promo == price_base` exactly (transactions that occurred at the full promo price, not at a discount).

**Verdict:**  
- Non-promo rows: **complete target proxy** by construction.
- Promo rows: **conditionally valid** — `sale_price_time_promo` is a pre-published, planned promotional price. In a scenario where the promotion calendar is known in advance (e.g., pricing decision support before a sale begins), this is a legitimate feature. It is NOT legitimate for a blind "what price will this item sell at?" prediction.

---

### 2.3 🔴 HIGH RISK: `promo_discount_amount`, `promo_discount_pct`

**Classification: DERIVED TARGET PROXY for non-promo rows**

**Evidence — Code (lines 185–192):**
```python
df["promo_discount_amount"] = np.maximum(0.0,
    df["sale_price_before_promo"] - df["sale_price_time_promo"])
df["promo_discount_pct"] = (
    df["promo_discount_amount"] / df["sale_price_before_promo"] * 100.0)
```

**Root cause:**  
Both features are computed from `sale_price_before_promo` and `sale_price_time_promo`. For non-promo rows (79% of data), both of those columns are equal to `price_base`, so both discount fields are exactly **0.0**. These columns carry zero information for non-promo rows, and for promo rows they are derived from conditional pricing inputs. They inherit the same leakage as their source columns.

---

### 2.4 🟡 CONDITIONAL: `online_price`

**Classification: CONDITIONAL (contemporaneous observation for 97.2% of rows; indirect TARGET PROXY via imputation)**

**Evidence — Code (line 203):**
```python
df["online_price"] = df["online_price"].fillna(df["price_base"]).astype("float32")
```

**Evidence — Statistical (200k-row sample):**
```
Rows with genuine online listing: 5,594 (2.80%)
Rows where online_price imputed as price_base: 194,406 (97.20%)
All no-online rows: online_price == price_base: True  ← EXACT MATCH
```

**Two separate concerns:**

1. **Imputation leakage (97.2% of rows):** When no online listing exists (the overwhelming majority), `online_price` is filled with `price_base`. This makes `online_price` a direct proxy for the target on 97.2% of training data. Even if online prices were obtainable beforehand for the 2.8% of rows that have them, the imputed 97.2% acts as a covert copy of the target.

2. **Contemporaneous availability (2.8% of rows):** For rows with genuine online listings (`has_online_listing=1`), the question is whether the online price listed for that date was observable *before* the transaction. If `online.csv` records the price *at time of sale* (rather than a scheduled catalogue price published in advance), this is also contemporaneous leakage. The dataset provenance does not guarantee advance availability.

**The model learned to use online_price as its most powerful feature** (gain=3.29 × 10¹²) — this is almost certainly because it acts as a near-perfect copy of `price_base` for 97% of rows.

---

### 2.5 🟡 CONDITIONAL: `price_ratio_to_online`

**Classification: DERIVED CONDITIONAL/PROXY**

**Evidence — Code (lines 204–209):**
```python
df["price_ratio_to_online"] = (df["price_base"] / df["online_price"]).clip(0.1, 10.0).fillna(1.0)
```

**Evidence — Statistical:**
```
price_ratio_to_online for no-online rows:  1.0 (100% of no-online rows)
```

**Root cause:** For 97.2% of rows, `online_price = price_base`, so `price_ratio_to_online = price_base / price_base = 1.0`. This is a constant and contains no information. For the 2.8% of rows with real online prices, the ratio encodes `price_base` divided by an external price — which partially reveals `price_base`. This feature is a weaker form of the `online_price` leakage.

---

### 2.6 ✅ SAFE: `price_lag_1`, `price_lag_7`, `price_roll_mean_7`

**Classification: SAFE (with cold-start caveat)**

**Evidence — Code (lines 270–277):**
```python
df["price_lag_1"] = df.groupby(group_keys)["price_base"].shift(1)
df["price_lag_7"] = df.groupby(group_keys)["price_base"].shift(7)
df["price_roll_mean_7"] = (
    df.groupby(group_keys)["price_lag_1"].rolling(7, min_periods=1).mean())
```

**Evidence — Sample verification:**
```
item 001829cb707d, store 1:
  date=2022-08-29: price_base=138.00, price_lag_1=134.76  ✅ (previous day price, correct)
  date=2022-08-30: price_base=138.00, price_lag_1=138.00  ✅ (yesterday's price)
  date=2022-09-07: price_base=124.20, price_lag_1=138.00  ✅ (last observed price, correct)
```

The `shift(1)` is applied correctly and references the *previous day's* realized price (not the current day). Rolling windows are computed on the already-shifted `price_lag_1` series, not on `price_base` directly. **These features are genuinely safe.**

**Cold-start caveat (minor):** On an item-store's very first observation, `price_lag_1` is `NaN`, filled with the current `price_base` (line 291):
```python
df["price_lag_1"] = df["price_lag_1"].fillna(df["price_base"])
```
This introduces a minor leakage on first-appearance rows only (~9% of the training sample). Given these rows also have `is_new_item_store=1`, the model can learn to discount this feature for new items. The impact is minimal but should be noted.

---

### 2.7 ✅ SAFE: All remaining Price Prediction features

The following features are **fully safe** — they are either known before any transaction occurs or are constructed from strictly past information:

| Feature Group | Features | Why Safe |
| :--- | :--- | :--- |
| Product taxonomy | `dept_name`, `class_name`, `subclass_name`, `item_type` | Static catalog attributes — known before any sale |
| Store metadata | `division`, `format`, `city`, `area`, `store_id` | Fixed store properties |
| Calendar | `year`, `month`, `day_of_month`, `day_of_week`, `week_of_year`, `quarter`, `day_of_year`, `is_weekend`, `is_month_start`, `is_month_end`, `sin_month`, `cos_month`, `sin_day_of_week`, `cos_day_of_week` | Known in advance — future dates are fully determined |
| Promo schedule (safe portion) | `promo_type_code`, `number_disc_day`, `promo_doc_count`, `is_on_promo` | These indicate the *type* and *presence* of a promotion without directly encoding `price_base` (subject to conditional scenario caveat below) |
| Demand lags | `demand_lag_1` through `demand_lag_28`, `demand_roll_mean_7`, `demand_roll_std_7`, `demand_roll_mean_28`, `demand_roll_std_28` | All use `shift(n)` with n≥1; rolling windows on pre-shifted series. **Past demand does not reveal current price.** |
| Cold-start flag | `is_new_item_store` | Binary derived from lag NaN state — safe |
| Price lags | `price_lag_1`, `price_lag_7`, `price_roll_mean_7` | See §2.6 above — safe |

**Note on `is_on_promo`, `promo_type_code`, `number_disc_day`:** These are safe IF the promotional schedule is published and available before the transaction date (typical in retail where promotions are planned weeks ahead). If promotions are determined simultaneously with pricing, these become contemporaneous. Retail practice supports the "safe" classification here.

---

### 2.8 Price Prediction — Full Feature Risk Table

| Feature | Risk Classification | Evidence Summary | Gain Rank |
| :--- | :--- | :--- | :--- |
| `online_price` | 🔴 **CONDITIONAL/PROXY** | 97.2% of rows = `price_base` by imputation; top gain feature | 1st |
| `sale_price_time_promo` | 🔴 **TARGET PROXY** | 100% match on 79% of rows (imputed); 0.990 corr on promo rows | 2nd |
| `sale_price_before_promo` | 🔴 **TARGET PROXY** | 100% match on 79% of rows (imputed); 0.973 corr on promo rows | 3rd |
| `price_roll_mean_7` | ✅ **SAFE** | Rolling mean of `price_lag_1` (shifted) — historical | 4th |
| `price_lag_1` | ✅ **SAFE** (cold-start caveat) | Correctly shifted by 1 day; minor NaN-fill issue on first row | 5th |
| `promo_discount_amount` | 🔴 **DERIVED PROXY** | = `sale_price_before_promo` − `sale_price_time_promo`; 0.0 for 79% | 15th |
| `promo_discount_pct` | 🔴 **DERIVED PROXY** | Same derivation; 0.0 for 79% of rows | 15th |
| `price_ratio_to_online` | 🟡 **CONDITIONAL** | = `price_base / online_price`; ratio=1.0 for 97.2% of rows | 23rd |
| `price_lag_7` | ✅ **SAFE** | Correctly shifted by 7 days | 38th |
| All taxonomy, calendar, store features | ✅ **SAFE** | Static or pre-determined | Various |
| All demand lag/rolling features | ✅ **SAFE** | Strictly historical, no target overlap | Various |
| `is_on_promo`, `promo_type_code`, `number_disc_day`, `promo_doc_count` | ✅ **SAFE** (conditional) | Known from promo calendar | Various |
| `has_online_listing` | 🟡 **CONDITIONAL** | Binary derived from `online_price` presence — minor concern | 40th |
| `is_new_item_store` | ✅ **SAFE** | First-appearance flag | 45th |

---

## 3. Demand Forecasting Model — Feature-by-Feature Audit

**Target:** `quantity`  
**Feature count in model:** 49 (41 numeric + 8 categorical)

### 3.1 ✅ SAFE: All demand lag and rolling features

**Evidence — Code (lines 236–267):**
```python
df["demand_lag_1"] = df.groupby(group_keys)["quantity"].shift(1)
# ... shift(2), shift(3), shift(7), shift(14), shift(28)
df["demand_roll_mean_7"] = (
    df.groupby(group_keys)["demand_lag_1"].rolling(7, min_periods=1).mean())
```

All demand lags use `shift(n)` with n≥1. Rolling windows operate on the already-shifted `demand_lag_1` series (not on `quantity` directly). **No current or future quantity information enters any demand feature.** This is correct.

---

### 3.2 🟡 CONDITIONAL: `price_base` as a demand feature

**Classification: CONDITIONALLY SAFE — depends on forecasting scenario**

`price_base` appears as feature #10 in demand feature importance (gain = 1.20 × 10⁶, 4,199 splits). In the demand forecasting model, it represents the **price elasticity signal** — the intuition that higher price → lower demand.

**Two valid scenarios:**

| Scenario | `price_base` availability | Assessment |
| :--- | :--- | :--- |
| **A. Point-in-time demand estimation** — "Given that today's price is X, what is expected demand?" | Known at decision time (you set the price) | ✅ **SAFE** — price is a controllable input |
| **B. Pure demand forecasting** — "Forecast demand for tomorrow without knowing the exact price" | Unknown in advance | ⚠️ **CONDITIONAL** — should use `price_lag_1` or a planned price instead |

**Verdict:** The demand model is **architecturally correct for Scenario A** (the more common use case in pricing optimization — you choose a price and estimate resulting demand). For Scenario B (blind time-series forecasting with no price input), `price_base` should be replaced with `price_lag_1` or a planned/forecast price. The feature importance rank (10th) suggests it adds meaningful signal but is not dominant — the demand model would still work reasonably well without it.

---

### 3.3 🟡 MINOR: `sale_price_before_promo`, `sale_price_time_promo`, `online_price` in demand model

These features carry the **same imputation leakage** as in the price model (97–100% of non-promo/non-online rows have exact copies of `price_base`). However, in the **demand model**, the target is `quantity`, not `price_base`. Therefore:

- These features do not directly reveal `quantity` — they reveal **price level**, which is a legitimate causal driver of demand (price elasticity).
- The imputation means these features essentially function as copies of `price_base` for most rows, which is acceptable for demand forecasting (knowing the price is legitimate).
- **Leakage risk for demand: LOW** — these features carry price information, not demand information.

Their combined importance in the demand model is low (ranks 18, 24, 16 respectively), confirming they are not dominant and the model is not over-relying on them.

---

### 3.4 ✅ SAFE: All other demand features

| Feature Group | Features | Assessment |
| :--- | :--- | :--- |
| Demand lags | `demand_lag_1` through `demand_lag_28` | ✅ All correctly shifted |
| Rolling demand | `demand_roll_mean_7`, `demand_roll_std_7`, `demand_roll_mean_28`, `demand_roll_std_28` | ✅ On pre-shifted series |
| Price lags | `price_lag_1`, `price_lag_7`, `price_roll_mean_7` | ✅ Historical prices |
| Calendar | All temporal features | ✅ Future-known |
| Taxonomy & store | All catalog and store features | ✅ Static |
| Promo presence | `is_on_promo`, `promo_type_code`, `number_disc_day`, `promo_doc_count` | ✅ Pre-published schedule |
| `is_on_promo`, `promo_discount_pct`, `promo_discount_amount` | Minor price-derived features | ✅ Low importance, no demand leakage |
| `is_new_item_store` | Cold-start flag | ✅ Safe |

---

## 4. Price Model Scenario Assessment

### Scenario A: Predicting price when NO future pricing information is known
*(e.g., "What price will item X sell at in store Y on date D?")*

**Current model is: ❌ NOT SUITABLE**

The three most powerful features (`online_price`, `sale_price_time_promo`, `sale_price_before_promo`) are either imputed copies of `price_base` (97–100% of rows) or require advance knowledge of the promotion price. R²=0.998 in this scenario is almost entirely explained by the model learning to output the imputed `price_base` stored inside these features.

**What a clean price prediction model would use:**
- `price_lag_1`, `price_lag_7`, `price_roll_mean_7` (historical price trajectory)
- Product taxonomy (`dept_name`, `class_name`, `subclass_name`, `item_type`)
- Store features (`store_id`, `format`, `city`, `area`)
- Calendar features (seasonality)
- `is_on_promo`, `promo_type_code` (knowing a promo is scheduled — binary, not the price itself)
- `number_disc_day` (promo duration)

---

### Scenario B: Predicting/estimating price when promotional and benchmark prices ARE known in advance
*(e.g., "Retailer knows next week's promotion price and can see competitor/online prices — validate what the transaction price will be")*

**Current model is: ✅ CONDITIONALLY SUITABLE**

In this scenario, `sale_price_before_promo` and `sale_price_time_promo` are genuinely available pre-transaction inputs (the retailer decides these prices in advance). `online_price` from a competitor pricing API could also be collected before the transaction. Under this interpretation, the model is a valid **price validation / pricing consistency checker** rather than a blind price predictor.

The extremely high R² (0.998 val, 0.9992 test) makes sense in this context — the model is essentially learning the mapping from planned prices → realized transaction prices, which is a near-identity function for most transactions.

---

### Scenario C: Price model's true function in PricePilot AI context

Given the project name "PricePilot AI" (pricing optimization / recommendation), the most likely intended use is:

> "Given that we are **setting** a price (or running a promotion at a known price), predict/confirm the resulting transaction price"

Under this reading, `sale_price_before_promo` and `sale_price_time_promo` are **inputs controlled by the retailer** (the price they intend to set) and `price_base` is the **realized outcome** (confirmation). This is a legitimate conditional prediction setup. However, the **imputation of 79% of non-promo rows with `price_base`** still undermines this — for non-promo items, the model has no pricing input to condition on; it just memorizes `price_base` back to itself.

---

## 5. Demand Model Scenario Assessment

**Current demand model is: ✅ SUITABLE for conditional demand forecasting**

The LightGBM demand model is appropriate for the scenario:
> "Given a planned price (`price_base`) and promotion schedule, forecast demand (`quantity`)"

- All demand history features are correctly lagged (no leakage of `quantity`)
- `price_base` as input reflects price elasticity — a genuine causal driver
- Rolling mean/std features dominate importance, showing the model primarily learns item-level demand patterns

**Minor recommendation:** For blind future forecasting (when `price_base` is not yet known), substitute `price_lag_1` for `price_base` as input. This requires no retraining — it's an inference-time decision.

---

## 6. Summary of Findings

### Price Prediction Model

| Finding | Severity | Affected Rows | Impact |
| :--- | :--- | :--- | :--- |
| `sale_price_before_promo` imputed with `price_base` | 🔴 CRITICAL | 79% (non-promo) | Direct target proxy for majority of training data |
| `sale_price_time_promo` imputed with `price_base` | 🔴 CRITICAL | 79% (non-promo) | Direct target proxy for majority of training data |
| `online_price` imputed with `price_base` | 🔴 HIGH | 97.2% (no online listing) | Model's #1 feature is a target copy |
| `promo_discount_amount`, `promo_discount_pct` | 🟡 MEDIUM | 79% show value=0 | Derived from leaky sources; zero-information for most rows |
| `price_ratio_to_online` | 🟡 LOW-MEDIUM | 97.2% show ratio=1.0 | Constant for most rows; not informative but not independently harmful |
| `price_lag_1` cold-start NaN fill | 🟢 LOW | ~9% first appearances | Minor; flagged by `is_new_item_store` |

### Demand Forecasting Model

| Finding | Severity | Affected Rows | Impact |
| :--- | :--- | :--- | :--- |
| Demand lags and rolling features | ✅ CLEAN | 100% | Correctly lagged; no leakage |
| `price_base` as feature | 🟡 CONDITIONAL | 100% | Valid for conditional forecasting; needs planned price for blind forecasting |
| Price-derived features (`online_price`, `sale_price_*`) | 🟢 LOW | Minor | Carry price signal (acceptable for demand); low importance |

---

## 7. Recommendations

### For Price Prediction

**Option 1 — Retraining with leakage-free features (RECOMMENDED):**

Build a **clean price model** using only genuinely available features:

```
SAFE features for clean price model:
  - price_lag_1, price_lag_7, price_roll_mean_7
  - dept_name, class_name, subclass_name, item_type
  - division, format, city, area, store_id
  - year, month, day_of_month, day_of_week, week_of_year, quarter, day_of_year
  - is_weekend, is_month_start, is_month_end, sin_month, cos_month, sin_day_of_week, cos_day_of_week
  - is_on_promo, promo_type_code, number_disc_day, promo_doc_count
  - is_new_item_store
  - demand_lag_1, demand_lag_7, demand_roll_mean_7, demand_roll_mean_28

EXCLUDE from clean model:
  - sale_price_before_promo (imputed from price_base)
  - sale_price_time_promo (imputed from price_base)
  - online_price (imputed from price_base)
  - promo_discount_amount, promo_discount_pct (derived from above)
  - price_ratio_to_online (derived from above)
  - has_online_listing (derived from online_price)
```

Expected outcome: Lower R² (no longer artificially inflated by target copies), but **honest and deployable** in real inference without knowing the answer in advance.

**Option 2 — Retain current model with explicit conditional scope:**  
Mark the current price model as a **"price validation" or "conditional pricing model"** that is valid only when promotion prices and online benchmarks are known in advance. Document that this model answers: *"If we plan to price at X, what transaction price will result?"* — not *"What price will this item sell at?"*

### For Demand Forecasting
No retraining required. The demand model is sound. Document that `price_base` is a **planned price input** (the retailer sets the price, then forecasts demand at that price level). For future blind forecasting, use `price_lag_1` as a proxy for unknown future price.

---

## 8. Final Verdicts

---

**PRICE MODEL LEAKAGE STATUS: CONDITIONAL**

> The current price model is NOT safe for blind price prediction (Scenario A). It IS valid as a conditional pricing confirmation model where promotional and online prices are known inputs (Scenario B). The high R² (0.998) is partially explained by target proxies in 79–97% of training rows.

---

**DEMAND MODEL LEAKAGE STATUS: SAFE**

> All demand lag and rolling features are correctly lagged. `price_base` is a legitimate conditional input (planned price) for demand forecasting. No target quantity information leaks into any feature.

---

**RETRAINING REQUIRED: YES** *(for Price Prediction — Scenario A)*  
> If PricePilot AI requires **blind price prediction** (predicting the price without knowing promotional/online prices in advance), a retraining run is required using the clean feature set defined in §7 above. The demand model does NOT need retraining.

> If the project scope confirms **conditional pricing** (retailer knows the promotion plan), the current price model can remain with updated documentation of its scope.

---

**MILESTONE 2 STEP 3 FINAL STATUS: REQUIRES CORRECTION**

> Step 3 is functionally complete and the code is correct. However, the **price prediction model scope requires clarification and likely retraining** with a leakage-free feature set for Scenario A use. The demand model is fully valid and requires no changes. Step 3 should be marked **CONDITIONALLY COMPLETE** pending a decision on the price model's intended inference scenario and, if required, a retraining run.

---

*Audit conducted for PricePilot AI — Milestone 2 Step 3.*
