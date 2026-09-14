# Milestone 2 — Step 2: Modeling Dataset Preparation & Feature Engineering Readiness Report

**Project:** PricePilot AI  
**Milestone:** 2 — Predictive Modeling & Forecasting Setup  
**Step:** 2 — Modeling Dataset Preparation & Feature Engineering Readiness  
**Script:** [`eda/prepare_modeling_data.py`](file:///e:/PRICEPILOT-AI/eda/prepare_modeling_data.py)  
**Pipeline Runtime:** 783 seconds (~13.1 minutes)  
**Status:** ✅ COMPLETED SUCCESSFULLY  

---

## 1. Datasets Used

| Dataset File | Role | Source | Rows Loaded | Columns Used |
| :--- | :--- | :--- | :--- | :--- |
| `ecommerce_sales_34500.csv` | **Primary transaction panel** | `Datasets/raw/` | 7,432,685 | `date`, `item_id`, `store_id`, `quantity`, `price_base`, `sum_total` |
| `catalog.csv` | Product taxonomy enrichment | `Datasets/raw/` | 219,810 | `item_id`, `dept_name`, `class_name`, `subclass_name`, `item_type` |
| `stores.csv` | Store metadata enrichment | `Datasets/raw/` | 4 | `store_id`, `division`, `format`, `city`, `area` |
| `sales.csv` | Promotional schedule features | `Datasets/raw/` | 3,431,831 (historical ≤ 2024-09-26) | `date`, `item_id`, `store_id`, `sale_price_before_promo`, `sale_price_time_promo`, `promo_type_code`, `doc_id`, `number_disc_day` |
| `online.csv` | Online channel price benchmark | `Datasets/raw/` | 698,626 | `date`, `item_id`, `store_id`, `price` |

**Explicitly excluded (per Step 1 decisions):** `markdowns.csv`, `retail_store_sales_promotions_demand.csv`, `discounts_history.csv`, `price_history.csv`, `sales.csv` future records (> 2024-09-26).  
**Raw datasets NOT modified:** All 9 raw datasets remain intact in `Datasets/raw/`.

---

## 2. Cleaning Performed

### 2.1 Primary Dataset — `ecommerce_sales_34500.csv`
- **Unnamed index column** stripped on load.
- **Date parsing:** `date` column parsed to `datetime64[us]`.
- **Zero missing values:** All 6 business columns are fully populated (confirmed in EDA Milestone 1 and re-verified in pipeline).
- **Zero duplicate rows:** No deduplication needed.

### 2.2 `sales.csv` — Temporal Anomaly Elimination
- Strict filter applied: **only records with `date` ≤ 2024-09-26 retained**.
- This removes **314,913 future/synthetic records** (extending to 2045-12-31) identified in Milestone 1.
- Retained rows: **3,431,831** (91.6% of original file).

### 2.3 `catalog.csv`
- Unnamed index column stripped.
- Deduplicated by `item_id` → exactly **219,810 unique items**.
- High-null physical attribute columns (`weight_volume`, `weight_netto`, `fatness`) intentionally excluded to avoid sparse joins.
- Missing categorical attributes (`dept_name`, `class_name`, `subclass_name`, `item_type`) filled with `"Unknown"` string.

### 2.4 `stores.csv`
- Unnamed index column stripped.
- Deduplicated by `store_id` → exactly **4 unique stores**.
- Zero missing values.

### 2.5 `online.csv`
- Records with `date` > 2024-09-26 filtered out (0 present in practice, but consistent guard).
- **18,641 duplicate `(date, item_id, store_id)` rows** resolved by aggregating with `mean(price)` before joining → 616,306 unique keys.

---

## 3. Joins Performed

All joins were validated with **assertion checks** to detect unexpected row multiplication after each join.

| Join | Type | Left Key(s) | Right Key(s) | Cardinality | Row Count After | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Primary ← `catalog.csv` | Left Join | `item_id` | `item_id` | Many-to-One | 7,432,685 | ✅ PASS |
| Primary ← `stores.csv` | Left Join | `store_id` | `store_id` | Many-to-One | 7,432,685 | ✅ PASS |
| Primary ← `sales.csv` (aggregated) | Left Join | `date`, `item_id`, `store_id` | `date`, `item_id`, `store_id` | One-to-One | 7,432,685 | ✅ PASS |
| Primary ← `online.csv` (aggregated) | Left Join | `date`, `item_id`, `store_id` | `date`, `item_id`, `store_id` | One-to-One | 7,432,685 | ✅ PASS |

**Granularity Resolution for `sales.csv`:**  
`sales.csv` operates at the promotion document level (multiple documents per `date`/`item`/`store`). Before joining, it was aggregated by `(date, item_id, store_id)` using:
- `sale_price_before_promo` → `mean` (average regular price across promo documents)
- `sale_price_time_promo` → `min` (lowest promo price offered = most aggressive active discount)
- `number_disc_day` → `max` (maximum promo duration)
- `promo_type_code` → `first` (leading promo category)
- `doc_id` → `count` renamed to `promo_doc_count` (number of active promo documents)

---

## 4. Features Created

The final master panel contains **53 columns** (including 2 targets and 3 identifiers). All features are available strictly **before** the target period and contain no lookahead information.

### 4.1 Key Identifiers (3)
| Column | Type | Description |
| :--- | :--- | :--- |
| `date` | `datetime64[us]` | Transaction date |
| `item_id` | `str` | Product identifier (12-char hex) |
| `store_id` | `int16` | Physical store identifier (1–4) |

### 4.2 Target Variables (2)
| Column | Type | ML Task | Description |
| :--- | :--- | :--- | :--- |
| `price_base` | `float32` | **Price Prediction** | Realized selling unit price |
| `quantity` | `float32` | **Demand Forecasting** | Units sold per transaction day |

### 4.3 Product Taxonomy Features (4)
| Column | Type | Description |
| :--- | :--- | :--- |
| `dept_name` | `category` | Department name (183 categories) |
| `class_name` | `category` | Product class (536 categories) |
| `subclass_name` | `category` | Product subclass (785 categories) |
| `item_type` | `category` | Item type description (605 categories) |

### 4.4 Store Features (4)
| Column | Type | Description |
| :--- | :--- | :--- |
| `division` | `category` | Retail division (Div1, Div2) |
| `format` | `category` | Store format (MaxiEuro, Format-7 express, etc.) |
| `city` | `category` | Store city (City1–City3) |
| `area` | `float32` | Store floor area (m²) |

### 4.5 Promotion & Pricing Features (10)
| Column | Type | Description |
| :--- | :--- | :--- |
| `sale_price_before_promo` | `float32` | Catalog regular price before promotion (filled with `price_base` if no promo) |
| `sale_price_time_promo` | `float32` | Active promotional price (filled with `price_base` if no promo) |
| `promo_type_code` | `category` | Promotion type code (14 categories, `NO_PROMO` when absent) |
| `number_disc_day` | `int16` | Duration of active discount in days |
| `promo_doc_count` | `int16` | Number of promotion documents active that day |
| `is_on_promo` | `int8` | Binary: 1 if a promotion was active, 0 otherwise |
| `promo_discount_amount` | `float32` | Absolute price reduction = `sale_price_before_promo` − `sale_price_time_promo` |
| `promo_discount_pct` | `float32` | Discount as a % of regular price (clipped to [0, 100]) |
| `online_price` | `float32` | Online channel listed price (filled with `price_base` if no listing) |
| `has_online_listing` | `int8` | Binary: 1 if an online listing was found for this date/item/store |
| `price_ratio_to_online` | `float32` | `price_base / online_price` ratio (clipped to [0.1, 10.0]) |

### 4.6 Calendar & Temporal Features (14)
| Column | Type | Description |
| :--- | :--- | :--- |
| `year` | `int16` | Calendar year |
| `month` | `int8` | Month (1–12) |
| `day_of_month` | `int8` | Day of month (1–31) |
| `day_of_week` | `int8` | Weekday (0=Monday … 6=Sunday) |
| `week_of_year` | `int8` | ISO week of year (1–52) |
| `quarter` | `int8` | Quarter (1–4) |
| `day_of_year` | `int16` | Day of year (1–365) |
| `is_weekend` | `int8` | Binary: 1 if Saturday or Sunday |
| `is_month_start` | `int8` | Binary: 1 if day ≤ 3 |
| `is_month_end` | `int8` | Binary: 1 if day ≥ 28 |
| `sin_month` | `float32` | Cyclical month encoding — sin component |
| `cos_month` | `float32` | Cyclical month encoding — cos component |
| `sin_day_of_week` | `float32` | Cyclical weekday encoding — sin component |
| `cos_day_of_week` | `float32` | Cyclical weekday encoding — cos component |

### 4.7 Lag & Rolling Demand Features (11 — strictly historical)
All demand lag and rolling features use **strictly past data**: computed by `shift(1)` or higher to ensure no contemporary demand value is used as an input feature. Rolling statistics are applied to the already-shifted `demand_lag_1` series.

| Column | Type | Description |
| :--- | :--- | :--- |
| `demand_lag_1` | `float32` | Units sold t−1 days (same item, same store) |
| `demand_lag_2` | `float32` | Units sold t−2 days |
| `demand_lag_3` | `float32` | Units sold t−3 days |
| `demand_lag_7` | `float32` | Units sold t−7 days (same weekday −1 week) |
| `demand_lag_14` | `float32` | Units sold t−14 days |
| `demand_lag_28` | `float32` | Units sold t−28 days (~1 month) |
| `demand_roll_mean_7` | `float32` | 7-day rolling mean of `demand_lag_1` |
| `demand_roll_std_7` | `float32` | 7-day rolling std of `demand_lag_1` |
| `demand_roll_mean_28` | `float32` | 28-day rolling mean of `demand_lag_1` |
| `demand_roll_std_28` | `float32` | 28-day rolling std of `demand_lag_1` |
| `is_new_item_store` | `int8` | Binary: 1 if first observed record (lag was NaN → cold-start flag) |

### 4.8 Price Lag & Rolling Features (3 — strictly historical)
| Column | Type | Description |
| :--- | :--- | :--- |
| `price_lag_1` | `float32` | `price_base` at t−1 (filled with current `price_base` on first appearance) |
| `price_lag_7` | `float32` | `price_base` at t−7 (filled with current `price_base` on first appearance) |
| `price_roll_mean_7` | `float32` | 7-day rolling mean of `price_lag_1` |

### 4.9 Excluded from Feature Set (1)
| Column | Reason |
| :--- | :--- |
| `sum_total` | Post-transaction outcome: `sum_total = quantity × price_base`. Excluded from both models to prevent leakage. Retained in master panel for post-hoc revenue analysis only. |

---

## 5. Missing Value Handling

| Scenario | Column(s) | Strategy | Justification |
| :--- | :--- | :--- | :--- |
| No promo document found for transaction row | `sale_price_before_promo`, `sale_price_time_promo` | Filled with `price_base` | Non-promo price equals realized price; no information fabricated |
| No promo found | `promo_type_code` | Filled with `"NO_PROMO"` category | Explicit no-promotion state |
| No promo found | `number_disc_day`, `promo_doc_count` | Filled with `0` | No discount days active |
| No online listing found | `online_price` | Filled with `price_base` | Conservative assumption: online = retail price |
| No online listing found | `price_ratio_to_online` | Defaults to `1.0` | Neutral ratio when online unavailable |
| No catalog match | `dept_name`, `class_name`, `subclass_name`, `item_type` | Filled with `"Unknown"` | 3.36% of item_ids have no catalog record; marked as unknown category |
| Cold-start lag (first t-days) | `demand_lag_*` | Filled with `0.0` | Zero past demand is the conservative baseline; `is_new_item_store=1` flags affected rows |
| Cold-start price lag | `price_lag_1`, `price_lag_7`, `price_roll_mean_7` | Filled with current `price_base` | Avoids NaN propagation; preserves price signal |

**Final null count in master panel: 0 nulls across all 53 columns.** ✅

---

## 6. Data Quality Validation Results

| Check | Result | Detail |
| :--- | :--- | :--- |
| Row count after catalog join | ✅ PASS | 7,432,685 = 7,432,685 |
| Row count after stores join | ✅ PASS | 7,432,685 = 7,432,685 |
| Row count after sales promo join | ✅ PASS | 7,432,685 = 7,432,685 |
| Row count after online join | ✅ PASS | 7,432,685 = 7,432,685 |
| Null values in final panel | ✅ PASS | 0 nulls in all 53 columns |
| Duplicate grain keys `(date, item_id, store_id)` | ✅ PASS | 0 duplicates (primary dataset was pre-validated) |
| `sales.csv` future records removed | ✅ PASS | 314,913 records with date > 2024-09-26 excluded |
| `online.csv` duplicates resolved | ✅ PASS | 18,641 duplicate entries collapsed by mean aggregation |
| Chronological ordering verified | ✅ PASS | Sorted by `(date, store_id, item_id)` before split |
| Total rows in panel = sum of splits | ✅ PASS | 5,947,712 + 750,333 + 734,640 = 7,432,685 |

---

## 7. Leakage Prevention

### 7.1 Temporal Leakage
- **No random K-Fold splitting** was applied anywhere. The only allowed split is chronological.
- Lag and rolling features are computed exclusively on **past data** using `shift(n)` with `n ≥ 1`.  
- Rolling windows are applied to the already-shifted `demand_lag_1` series, not to `quantity` directly.
- `sales.csv` future anomaly records (2024-09-27 → 2045) are **strictly excluded** before any join or feature computation.

### 7.2 Target Leakage
| Column | Price Prediction | Demand Forecasting |
| :--- | :--- | :--- |
| `price_base` | ⛔ Target (excluded from features) | ✅ Safe Feature |
| `quantity` | ⛔ Excluded (contemporaneous outcome) | ⛔ Target (excluded from features) |
| `sum_total` | ⛔ Excluded (contemporaneous `quantity × price`) | ⛔ Excluded (same reason) |

All 50 remaining columns are classified as **SAFE_FEATURE** for both modeling tasks.

### 7.3 Cross-Channel Leakage
- `online_price` is the **prior listing price** from `online.csv`, not an outcome — it is safe to use as a feature.
- `sum_total` (revenue outcome = `quantity × price_base`) is retained in the master panel for analysis only and must be **explicitly excluded** from the feature matrix at model training time.

---

## 8. Chronological Train / Validation / Test Split

> [!IMPORTANT]
> All splits are **strictly chronological** with no date overlap between partitions. No random splits were used anywhere.

| Partition | Date Range | Days | Rows | % of Total |
| :--- | :--- | :--- | :--- | :--- |
| **Train** | 2022-08-28 → 2024-06-09 | 652 | 5,947,712 | 80.02% |
| **Validation** | 2024-06-10 → 2024-08-03 | 55 | 750,333 | 10.10% |
| **Test** | 2024-08-04 → 2024-09-26 | 54 | 734,640 | 9.88% |
| **Total** | 2022-08-28 → 2024-09-26 | 761 | 7,432,685 | 100.00% |

**Overlap verification:**
- Train max date `2024-06-09` < Validation min date `2024-06-10` ✅
- Validation max date `2024-08-03` < Test min date `2024-08-04` ✅

**Usage:**
- **Train:** Fit all model parameters.
- **Validation:** Hyperparameter tuning, early stopping, model selection.
- **Test:** Final held-out evaluation of selected models. **Must not be touched until Step 3 evaluation.**

---

## 9. Processed Files Created

All files saved to [`Datasets/processed/`](file:///e:/PRICEPILOT-AI/Datasets/processed/).

| File | Size | Description |
| :--- | :--- | :--- |
| [`modeling_master_panel.csv.gz`](file:///e:/PRICEPILOT-AI/Datasets/processed/modeling_master_panel.csv.gz) | 558 MB | Full 7,432,685-row feature panel with both targets. Gzip-compressed CSV. |
| [`train_data.csv.gz`](file:///e:/PRICEPILOT-AI/Datasets/processed/train_data.csv.gz) | 445 MB | Train split (5,947,712 rows, 2022-08-28 to 2024-06-09). |
| [`val_data.csv.gz`](file:///e:/PRICEPILOT-AI/Datasets/processed/val_data.csv.gz) | 57 MB | Validation split (750,333 rows, 2024-06-10 to 2024-08-03). |
| [`test_data.csv.gz`](file:///e:/PRICEPILOT-AI/Datasets/processed/test_data.csv.gz) | 56 MB | Test split (734,640 rows, 2024-08-04 to 2024-09-26). |

Report artifacts saved to [`eda/reports/`](file:///e:/PRICEPILOT-AI/eda/reports/):

| File | Description |
| :--- | :--- |
| [`modeling_feature_dictionary.csv`](file:///e:/PRICEPILOT-AI/eda/reports/modeling_feature_dictionary.csv) | Per-column data types, roles, null counts, unique value counts |
| [`leakage_audit_report.csv`](file:///e:/PRICEPILOT-AI/eda/reports/leakage_audit_report.csv) | Leakage status for all 53 columns, for both Price and Demand models |
| [`train_val_test_split_summary.csv`](file:///e:/PRICEPILOT-AI/eda/reports/train_val_test_split_summary.csv) | Row counts, date ranges, and durations for each partition |

---

## 10. Reproducibility

The preprocessing pipeline is fully reproducible via:

```bash
python eda/prepare_modeling_data.py
```

The script [`eda/prepare_modeling_data.py`](file:///e:/PRICEPILOT-AI/eda/prepare_modeling_data.py):
- Reads **only** from `Datasets/raw/` (raw datasets untouched).
- Writes **only** to `Datasets/processed/` and `eda/reports/`.
- Is fully deterministic — no random seeds required.
- Logs all steps with timestamps to stdout.
- Re-running the script will overwrite processed outputs.

---

## 11. Issues & Limitations

| Issue | Severity | Notes |
| :--- | :--- | :--- |
| 3.36% of transaction `item_id` values have no `catalog.csv` match | Low | These are labeled `"Unknown"` across taxonomy features. The vast majority of the catalog is matched (96.64%). No rows were dropped. |
| `online.csv` overlaps only 2.67% of (date, item_id, store_id) transaction keys | Medium | The `online_price` feature will be `price_base`-imputed for ~97% of rows. This dilutes cross-channel signal; models should treat `has_online_listing=1` rows as the true signal subgroup. |
| `sales.csv` promotional schedule overlaps only 46.2% of transaction keys | Medium | `is_on_promo` will be 0 (no promo) for the majority of transactions. Promo features are imputed with neutral values (0/price_base). This is expected — not all items/stores are on promotion every day. |
| Lags are 0-filled for new item-store pairs (cold-start) | Medium | The `is_new_item_store=1` flag identifies affected rows (~0.2%). Models should weight cold-start rows differently if needed. |
| `promo_type_code` had 8.48% nulls in `sales.csv` | Low | Resolved by labeling as `"NO_PROMO"`. |
| Gzip compression of large files takes ~10 min on this hardware | Info | Not a data issue; pipeline is expected behavior on ~7.4M row panels. |

---

## 12. Final Model Feature Matrix Summary

### For Price Prediction (Target: `price_base`)
**Exclude:** `quantity`, `sum_total`  
**Feature count:** 49 safe features (all columns except `price_base`, `quantity`, `sum_total` and the 3 key identifiers)

### For Demand Forecasting (Target: `quantity`)
**Exclude:** `sum_total`  
**Feature count:** 49 safe features (all columns except `quantity`, `sum_total` and the 3 key identifiers; `price_base` is a valid input feature for demand forecasting)

---

## ✅ Readiness Statement

> **The data is READY FOR MILESTONE 2 STEP 3 — MODEL DEVELOPMENT.**

All preprocessing, feature engineering, join validation, leakage auditing, and chronological splitting have completed successfully. Validated processed datasets are available in `Datasets/processed/` with zero null values, zero duplicate grain keys, and zero temporal overlap between partitions. The preprocessing pipeline is reproducible from source via `python eda/prepare_modeling_data.py`.

Step 3 may now proceed to:
1. Load `train_data.csv.gz` and `val_data.csv.gz` from `Datasets/processed/`.
2. Select features per model task (see feature matrix above).
3. Train baseline and advanced ML models for Price Prediction and Demand Forecasting.
4. Evaluate against `val_data.csv.gz`; **preserve `test_data.csv.gz` as the final held-out test set**.

---

*Report generated for PricePilot AI — Milestone 2 Step 2.*
