# Milestone 2: Dataset Compatibility Analysis & Final Dataset Selection Report

**Project:** PricePilot AI  
**Milestone:** 2 — Predictive Modeling & Forecasting Setup  
**Focus Area:** Dataset Compatibility Analysis & Final Dataset Selection for Price Prediction & Demand Forecasting  
**Author:** AI Engineering Team  
**Status:** Completed & Validated  

---

## 1. Executive Summary

Milestone 2 initiates the core machine learning phase for **Price Prediction** and **Demand Forecasting**. To ensure high model accuracy, prevent temporal/target leakage, and avoid key misalignment, this report provides a systematic compatibility analysis across all 9 candidate datasets available in the repository.

### Key Takeaway Summary
* **Primary Core Dataset for Price Prediction & Demand Forecasting:** `ecommerce_sales_34500.csv` (7,432,685 rows across all 4 retail stores covering 2022-08-28 to 2024-09-26). It contains daily realized base prices (`price_base`), demanded quantities (`quantity`), and total revenue (`sum_total`).
* **Essential Supporting Datasets:**
  1. `sales.csv` (Historical subset $\le$ 2024-09-26): Enriches transactions with regular price before promo, promotional discounted price, promo type, and promo duration.
  2. `catalog.csv`: Enriches transactions with product taxonomy hierarchy (`dept_name`, `class_name`, `subclass_name`).
  3. `stores.csv`: Enriches transactions with physical store metadata (`division`, `format`, `city`, `area`).
* **Excluded / Discarded Datasets for Initial Baseline:**
  1. `markdowns.csv`: 0% key/ID overlap with the retail ecosystem; incompatible numeric schema and distinct stores (1–50).
  2. `retail_store_sales_promotions_demand.csv`: Redundant, partial subset covering only 2 of 4 stores (1 and 4).
  3. `discounts_history.csv`: Sparse binary records lacking price/quantity; superseded by `sales.csv`.
  4. `price_history.csv`: Redundant and limited sample size (only 313 items vs 28k+).
  5. `sales.csv` Future Records (> 2024-09-26): 314,913 records extending to 2045 isolated to prevent severe lookahead leakage.

---

## 2. Comprehensive Dataset-by-Dataset Analysis

Each of the 9 candidate datasets is evaluated across all structural, temporal, and semantic criteria below.

```
+-------------------------------------------------------------------------------------------------------------+
|                                    CANDIDATE DATASET LANDSCAPE OVERVIEW                                     |
+-------------------------------------------------------------------------------------------------------------+
|                                                                                                             |
|   +---------------------------------------+         +---------------------------------------------------+   |
|   |         MAIN RETAIL ECOSYSTEM         |         |                STANDALONE DATASET                 |   |
|   |  (Hash item_id, stores 1-4, 2022-2024)|         |     (Numeric product_id, stores 1-50, 2024)       |   |
|   +---------------------------------------+         +---------------------------------------------------+   |
|   | • ecommerce_sales_34500.csv (7.43M)   |         | • markdowns.csv (2,800 rows)                      |   |
|   | • sales.csv (3.75M promo records)     |         |   (0% ID overlap with main retail ecosystem)      |   |
|   | • catalog.csv (219.8k items)          |         +---------------------------------------------------+   |
|   | • stores.csv (4 stores)               |                                                                 |
|   | • online.csv (698.6k price listings)  |                                                                 |
|   | • retail_store_sales_... (1.12M sub)  |                                                                 |
|   | • price_history.csv (8.9k audit)      |                                                                 |
|   | • discounts_history.csv (35.2k sparse)|                                                                 |
|   +---------------------------------------+                                                                 |
+-------------------------------------------------------------------------------------------------------------+
```

---

### 2.1 `ecommerce_sales_34500.csv`
* **Available Columns:** `date`, `item_id`, `quantity`, `price_base`, `sum_total`, `store_id` (6 business columns).
* **Common Identifiers:** `item_id` (12-char hex string, 28,182 unique items), `store_id` (integer, values 1, 2, 3, 4).
* **Date Columns & Range:** `date`, **2022-08-28 to 2024-09-26** (761 continuous daily periods, 7,432,685 rows).
* **Data Granularity:** Daily item-store transaction level `(date, item_id, store_id)`. Keys are 100% unique (0 duplicate key rows).
* **Price Information:** **YES** — `price_base` represents the realized base unit selling price.
* **Demand / Sales Information:** **YES** — `quantity` represents unit sales volume; `sum_total` represents daily transaction revenue.
* **Inventory / Promotion / Discount Information:** **NO direct flags** — contains realized pricing, but requires promotional schedule joins for promo codes and discounts.
* **Potential Compatibility:** 
  * 100% store key compatibility with `stores.csv`.
  * 96.64% item key compatibility with `catalog.csv` (27,234 of 28,182 items).
  * 20.44% exact key overlap with `sales.csv` promotional records.
* **Known Data Quality Concerns from M1:**
  * Filename is a legacy misnomer (`_34500.csv` suffix, but contains 7.43M rows).
  * Zero missing values across all columns.
  * Zero duplicate rows.

---

### 2.2 `retail_store_sales_promotions_demand.csv`
* **Available Columns:** `date`, `item_id`, `quantity`, `price_base`, `sum_total`, `store_id` (6 business columns).
* **Common Identifiers:** `item_id` (18,405 unique items), `store_id` (stores 1 and 4 only).
* **Date Columns & Range:** `date`, **2022-08-28 to 2024-09-26** (1,123,412 rows).
* **Data Granularity:** Daily item-store transaction level `(date, item_id, store_id)`.
* **Price Information:** **YES** — `price_base`.
* **Demand / Sales Information:** **YES** — `quantity`, `sum_total`.
* **Inventory / Promotion / Discount Information:** **NO direct flags**.
* **Potential Compatibility:** Exact schema match with `ecommerce_sales_34500.csv`, but represents an incomplete subset covering only stores 1 and 4 (missing stores 2 and 3 and ~6.3M records).
* **Known Data Quality Concerns from M1:**
  * Partial store coverage (2 stores vs 4 stores).
  * 80.7% key duplication with `ecommerce_sales_34500.csv`.

---

### 2.3 `sales.csv`
* **Available Columns:** `date`, `item_id`, `sale_price_before_promo`, `sale_price_time_promo`, `promo_type_code`, `doc_id`, `number_disc_day`, `store_id` (8 business columns).
* **Common Identifiers:** `item_id` (16,081 unique items), `store_id` (stores 1, 2, 3, 4), `doc_id` (promotion document ID).
* **Date Columns & Range:** `date`, **2022-08-28 to 2045-12-31** (3,746,744 total rows; 3,431,831 historical rows $\le$ 2024-09-26).
* **Data Granularity:** Promotional document per item-store-date level `(date, item_id, store_id, doc_id)`.
* **Price Information:** **YES** — `sale_price_before_promo` (baseline catalog price) and `sale_price_time_promo` (discounted promotional price).
* **Demand / Sales Information:** **NO volume data** — despite the filename `sales.csv`, it is an operational promotion schedule table.
* **Inventory / Promotion / Discount Information:** **YES** — `promo_type_code`, `doc_id`, `number_disc_day` (duration of discount in days), and explicit price discounts.
* **Potential Compatibility:** High compatibility with `ecommerce_sales_34500.csv` on `(date, item_id, store_id)` to calculate discount depth ($\text{Price}_{\text{before}} - \text{Price}_{\text{promo}}$) and promo activation.
* **Known Data Quality Concerns from M1:**
  * **Temporal Anomaly:** 314,913 records (8.4%) have dates from 2024-09-27 to 2045-12-31. These must be isolated into a future table to prevent severe lookahead data leakage.
  * `promo_type_code` contains 317,846 nulls (8.48%).
  * Multi-document granularity: multiple promotions can apply to the same item/store/date, requiring aggregation before merging with daily sales panels.

---

### 2.4 `catalog.csv`
* **Available Columns:** `item_id`, `dept_name`, `class_name`, `subclass_name`, `item_type`, `weight_volume`, `weight_netto`, `fatness` (8 business columns).
* **Common Identifiers:** `item_id` (219,810 unique products).
* **Date Columns & Range:** None (static master reference table).
* **Data Granularity:** Unique product level `(item_id)`.
* **Price Information:** **NO**.
* **Demand / Sales Information:** **NO**.
* **Inventory / Promotion / Discount Information:** **NO**.
* **Potential Compatibility:** 1:1 dimension lookup for `item_id` across all retail transaction panels. Covers 96.64% of transaction items in `ecommerce_sales_34500.csv`.
* **Known Data Quality Concerns from M1:**
  * High missingness in physical product attributes: `fatness` (96.7%), `item_type` (80.2%), `weight_netto` (77.7%), `weight_volume` (62.3%).
  * Categorical hierarchy (`dept_name`, `class_name`, `subclass_name`) has **0% missing values** and is fully reliable.

---

### 2.5 `stores.csv`
* **Available Columns:** `store_id`, `division`, `format`, `city`, `area` (5 business columns).
* **Common Identifiers:** `store_id` (stores 1, 2, 3, 4).
* **Date Columns & Range:** None (static store dimension table).
* **Data Granularity:** Unique physical store level `(store_id)`.
* **Price Information:** **NO**.
* **Demand / Sales Information:** **NO**.
* **Inventory / Promotion / Discount Information:** **NO** (provides store operational context: store format, division, city, square footage).
* **Potential Compatibility:** 1:1 dimension lookup for `store_id` across all retail datasets (100% key match).
* **Known Data Quality Concerns from M1:**
  * Minimal size (4 rows), zero missing values, zero duplicates.

---

### 2.6 `online.csv`
* **Available Columns:** `date`, `item_id`, `price`, `code`, `store_id` (5 business columns).
* **Common Identifiers:** `item_id` (37,624 unique items), `store_id` (stores 1, 2, 3, 4).
* **Date Columns & Range:** `date`, **2022-08-28 to 2024-09-26** (698,626 rows).
* **Data Granularity:** Daily item-store online channel price observation.
* **Price Information:** **YES** — `price` (e-commerce online listed price).
* **Demand / Sales Information:** **NO volume data**.
* **Inventory / Promotion / Discount Information:** Contains catalog/promo grouping `code`.
* **Potential Compatibility:** Overlaps with physical retail item/store keys; can be used for cross-channel price elasticity analysis.
* **Known Data Quality Concerns from M1:**
  * Contains 18,641 exact duplicate rows (2.67%).
  * Contains 0.0 price values for promotional / non-priced items.

---

### 2.7 `price_history.csv`
* **Available Columns:** `date`, `item_id`, `normal_price`, `price`, `quantity`, `store_id` (6 business columns).
* **Common Identifiers:** `item_id` (313 unique items), `store_id` (stores 1, 2, 4).
* **Date Columns & Range:** `date`, **2022-08-28 to 2024-09-26** (8,979 rows).
* **Data Granularity:** Daily item-store audit log for a small sample of items.
* **Price Information:** **YES** — `normal_price`, `price`.
* **Demand / Sales Information:** **YES** — `quantity` (limited sample).
* **Inventory / Promotion / Discount Information:** Implicit regular vs promo price delta.
* **Potential Compatibility:** Compatible keys, but restricted to only 313 items.
* **Known Data Quality Concerns from M1:**
  * Contains 268 duplicate rows (2.98%).
  * Extremely narrow item coverage (<1.2% of catalog).

---

### 2.8 `discounts_history.csv`
* **Available Columns:** `item_id`, `date`, `store_id` (3 business columns).
* **Common Identifiers:** `item_id` (15,398 unique items), `store_id` (stores 1, 2, 3, 4).
* **Date Columns & Range:** `date`, **2019-10-17 to 2024-09-26** (35,202 rows).
* **Data Granularity:** Sparse item-store-date discount occurrence indicator.
* **Price Information:** **NO**.
* **Demand / Sales Information:** **NO**.
* **Inventory / Promotion / Discount Information:** Binary discount presence only.
* **Potential Compatibility:** Compatible keys, but temporal mismatch (3 years of pre-sales historical records from 2019 to August 2022).
* **Known Data Quality Concerns from M1:**
  * Lacks discount depth, price levels, or promo types. Fully superseded by `sales.csv`.

---

### 2.9 `markdowns.csv`
* **Available Columns:** `store_id`, `product_id`, `date`, `category`, `price`, `promotion_active`, `discount_percent`, `units_sold`, `inventory_level`, `day_of_week` (10 business columns).
* **Common Identifiers:** `product_id` (integer, 947 unique products), `store_id` (integers 1 to 50).
* **Date Columns & Range:** `date`, **2024-01-01 to 2024-12-31** (2,800 rows).
* **Data Granularity:** Daily store-product department store observations.
* **Price Information:** **YES** — `price`.
* **Demand / Sales Information:** **YES** — `units_sold`.
* **Inventory / Promotion / Discount Information:** **YES** — `promotion_active`, `discount_percent`, `inventory_level`.
* **Potential Compatibility:** **INCOMPATIBLE** with the primary retail ecosystem.
  * 0% item overlap (`product_id` integers vs 12-character hex `item_id`).
  * Incompatible store domain (stores 1–50 vs stores 1–4).
  * Date range disconnected (single year 2024).
* **Known Data Quality Concerns from M1:**
  * Standalone department store benchmark dataset; cannot be joined with the core multi-store retail tables.

---

## 3. Dataset Compatibility & Merge Validation Matrix

| Dataset | Entity Key | Date Range | Rows | Target Overlap with Core Panel | Join Type to Core Panel | Join Feasibility & Validity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ecommerce_sales_34500.csv`** | `(date, item_id, store_id)` | 2022-08-28 to 2024-09-26 | 7,432,685 | **100% (Base Panel)** | Primary Table | **VALID (Primary)** |
| **`catalog.csv`** | `item_id` | Master (N/A) | 219,810 | 96.64% of items | `Left Join` (Many-to-One) | **VALID** (Product hierarchy features) |
| **`stores.csv`** | `store_id` | Master (N/A) | 4 | 100% of stores | `Left Join` (Many-to-One) | **VALID** (Store format/city/area features) |
| **`sales.csv` (Historical $\le$ 2024-09-26)** | `(date, item_id, store_id)` | 2022-08-28 to 2024-09-26 | 3,431,831 | 20.44% of transactions | `Left Join` (Aggregated $\rightarrow$ 1:1) | **VALID** (Promo price & discount features) |
| **`online.csv`** | `(date, item_id, store_id)` | 2022-08-28 to 2024-09-26 | 698,626 | 2.67% of transactions | `Left Join` (Deduplicated) | **VALID (Secondary)** (Online price elasticity) |
| **`price_history.csv`** | `(date, item_id, store_id)` | 2022-08-28 to 2024-09-26 | 8,979 | 0.12% of transactions | `Left Join` | **REDUNDANT** (Omit to avoid complexity) |
| **`discounts_history.csv`** | `(date, item_id, store_id)` | 2019-10-17 to 2024-09-26 | 35,202 | 0.01% of transactions | `Left Join` | **REDUNDANT** (Superseded by `sales.csv`) |
| **`retail_store_sales_promotions_demand.csv`** | `(date, item_id, store_id)` | 2022-08-28 to 2024-09-26 | 1,123,412 | 15.11% of base panel | N/A (Duplicate subset) | **INVALID / REDUNDANT** (Incomplete store slice) |
| **`markdowns.csv`** | `(date, product_id, store_id)` | 2024-01-01 to 2024-12-31 | 2,800 | 0.00% (Foreign Keys) | N/A (Incompatible schema) | **INCOMPATIBLE** (Standalone dataset only) |

---

## 4. Final Dataset Selection for Milestone 2

```
+-------------------------------------------------------------------------------------------------------------+
|                                    MILESTONE 2 RECOMMENDED MODELING ARCHITECTURE                            |
+-------------------------------------------------------------------------------------------------------------+
|                                                                                                             |
|   +-----------------------------------------------------------------------------------------------------+   |
|   |                       PRIMARY TRANSACTION PANEL: ecommerce_sales_34500.csv                          |   |
|   |                       (7,432,685 rows | 28,182 items | 4 stores | 761 days)                         |   |
|   |                       Targets: quantity (Demand) | price_base (Price Prediction)                    |   |
|   +-----------------------------------------------------------------------------------------------------+   |
|                                       │                     │                    │                          |
|                     Left Join (1:1)   │   Left Join (M:1)   │   Left Join (M:1)  │                          |
|                                       ▼                     ▼                    ▼                          |
|   +---------------------------------------+  +-------------------+  +-----------------------------------+   |
|   |         PROMOTION SCHEDULE            |  |  PRODUCT CATALOG  |  |          STORE METADATA           |   |
|   |      sales.csv (<= 2024-09-26)        |  |    catalog.csv    |  |             stores.csv            |   |
|   | Features:                             |  | Features:         |  | Features:                         |   |
|   | • sale_price_before_promo             |  | • dept_name       |  | • format                          |   |
|   | • sale_price_time_promo               |  | • class_name      |  | • division                        |   |
|   | • discount_amount & discount_rate     |  | • subclass_name   |  | • city                            |   |
|   | • promo_type_code & number_disc_day   |  |                   |  | • area                            |   |
|   +---------------------------------------+  +-------------------+  +-----------------------------------+   |
+-------------------------------------------------------------------------------------------------------------+
```

### A. Primary Dataset for Price Prediction
* **Selected Dataset:** `ecommerce_sales_34500.csv` merged with promotional pricing from `sales.csv` (historical slice).
* **Rationale:** Contains the ground-truth realized selling price (`price_base`) across all 4 retail stores for 28,182 items over 761 days. When enriched with `sales.csv`, the model learns baseline regular pricing vs promotional price elasticity.
* **Target Variables:** `price_base` (or discount depth $\text{Price}_{\text{before}} - \text{Price}_{\text{promo}}$).

### B. Primary Dataset for Demand Forecasting
* **Selected Dataset:** `ecommerce_sales_34500.csv`.
* **Rationale:** Contains continuous daily sales volumes (`quantity`) and revenue (`sum_total`) at the exact item-store-date granularity required for store-level replenishment and chain demand forecasting.
* **Target Variables:** `quantity` (units demanded) and `sum_total` (revenue forecasted).

### C. Supporting Datasets
1. **`sales.csv` (Historical Slice $\le$ 2024-09-26):**
   * **Role:** Essential for pricing and promotion feature engineering. Provides pre-promo price, promo price, discount rate, promo duration, and promo document type.
2. **`catalog.csv`:**
   * **Role:** Product categorization features. Provides high-integrity hierarchical groupings (`dept_name`, `class_name`, `subclass_name`) to enable category-level price elasticity and cross-product cold-start generalization.
3. **`stores.csv`:**
   * **Role:** Store-level features. Provides store format (`MaxiEuro`, `Format-7 express`), city, and store floor area to control for store-size demand variations.
4. **`online.csv` (Optional/Secondary):**
   * **Role:** Omnichannel price benchmark feature (`online_price`), providing competitive/channel price reference.

### D. Datasets NOT to be Used for Initial Milestone 2 Models & Why
1. **`markdowns.csv`:**
   * **Reason:** Incompatible ID namespace (numeric product IDs vs 12-char hex strings; 50 stores vs 4 stores). 0% overlap with catalog or transactions. Merging would result in empty/corrupted joins.
2. **`retail_store_sales_promotions_demand.csv`:**
   * **Reason:** Incomplete, redundant subset of `ecommerce_sales_34500.csv`. It only includes stores 1 and 4 (missing stores 2 and 3 and 85% of volume). Using both would cause duplicate counting and sample bias.
3. **`discounts_history.csv`:**
   * **Reason:** Sparse indicator containing only `(item_id, date, store_id)` without price or demand metrics, with dates starting in 2019 (pre-sales period). It is completely superseded by `sales.csv`.
4. **`price_history.csv`:**
   * **Reason:** Covers only 313 items (<1.2% of catalog) and contains duplicates. Redundant given the full panel in `ecommerce_sales_34500.csv`.
5. **Future Slice of `sales.csv` (Dates > 2024-09-26 up to 2045):**
   * **Reason:** Identified in Milestone 1 as a future/synthetic anomaly (314,913 records). Including these in historical training creates severe temporal leakage and artificially contaminates model evaluations.

---

## 5. Join Feasibility & Validation Guidelines for Next Phase

When the modeling pipeline prepares the feature store for Milestone 2:
1. **Key Matching:** Join on strict composite keys: `(date, item_id, store_id)` for temporal data; `item_id` for catalog; `store_id` for stores.
2. **Granularity Resolution:**
   * Aggregate `sales.csv` by `(date, item_id, store_id)` prior to merging (taking `min(sale_price_time_promo)` and `max(number_disc_day)`) to guarantee a deterministic 1:1 join with the sales panel.
3. **Temporal Partitioning:**
   * Use strict chronological splitting (Train: $\le$ 80% date quantile; Test: remaining 20% future horizon).
   * **Zero Random K-Fold Splits** across time to prevent future data leakage.
4. **Leakage Elimination:** Exclude contemporaneous target columns (`sum_total`, other-channel sales volume) from the feature set when predicting `quantity` or `price_base`.

---
*Report generated and validated for PricePilot AI — Milestone 2 Modeling Preparation.*
