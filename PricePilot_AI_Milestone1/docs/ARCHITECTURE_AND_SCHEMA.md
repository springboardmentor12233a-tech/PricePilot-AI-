# PricePilot AI: System Architecture & Database Schema Specification
**Milestone 1 Deliverable — Week 1 & 2**

---

## 1. System Architecture

```
                                  +-------------------------------------------------------+
                                  |                     ACCESS LAYER                      |
                                  |  Web Dashboard | Role Switcher | REST API Client      |
                                  +---------------------------+---------------------------+
                                                              | (HTTPS / JSON / JWT)
                                                              v
+---------------------------------------------------------------------------------------------------------------------+
|                                            FASTAPI BACKEND SERVICE ENGINE                                           |
|                                                                                                                     |
|  +---------------------------+  +---------------------------+  +-------------------------------------------------+  |
|  |    AUTH & RBAC MODULE     |  |   PRODUCT CATALOG MODULE  |  |           REVENUE INTELLIGENCE ENGINE           |  |
|  | - JWT Token Encoding      |  | - Catalog Management      |  | - Portfolio KPI Aggregation                     |  |
|  | - Role Permission Guards  |  | - Margin Guardrails       |  | - Time-Series Revenue Trend (7D/30D/90D/1Y)     |  |
|  | - Secure Password Hashing |  | - Price Modification      |  | - Category Profit & Margin Distribution         |  |
|  +---------------------------+  | - PriceHistory Audit Log  |  | - Price Elasticity Calculations                 |  |
|                                 +---------------------------+  +-------------------------------------------------+  |
+-------------------------------------------------------------+-------------------------------------------------------+
                                                              |
                                                              v
+---------------------------------------------------------------------------------------------------------------------+
|                                                  DATA STORAGE LAYER                                                 |
|                                                                                                                     |
|   +-------------------+       +-------------------+       +-------------------+       +-------------------------+   |
|   |       users       |       |     products      |       |   price_history   |       |      sales_records      |   |
|   +-------------------+       +-------------------+       +-------------------+       +-------------------------+   |
|   | id (PK)           |       | id (PK)           |       | id (PK)           |       | id (PK)                 |   |
|   | email             |       | sku               |       | product_id (FK)   |       | product_id (FK)         |   |
|   | username          |       | name              |       | old_price         |       | units_sold              |   |
|   | hashed_password   |       | category          |       | new_price         |       | unit_price              |   |
|   | role              |       | cost_price        |       | change_reason     |       | discount_pct            |   |
|   | is_active         |       | current_price     |       | changed_by        |       | revenue                 |   |
|   | created_at        |       | min_price         |       | created_at        |       | gross_profit            |   |
|   +-------------------+       | max_price         |       +-------------------+       | is_promotion            |   |
|                               | target_margin     |                                   | is_holiday              |   |
|                               | stock_level       |                                   | sales_channel           |   |
|                               | rating            |                                   | recorded_date           |   |
|                               +-------------------+                                   +-------------------------+   |
+---------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Database Schema (DDL)

### A. `users` Table
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | User Identifier |
| `email` | `VARCHAR` | Unique, Not Null | Account Login Email |
| `username` | `VARCHAR` | Not Null | Display Name |
| `hashed_password` | `VARCHAR` | Not Null | Bcrypt Password Hash |
| `role` | `VARCHAR` | Default: `pricing_manager` | Role (`pricing_manager`, `business_analyst`, `admin`) |
| `is_active` | `BOOLEAN` | Default: `True` | Account status |
| `created_at` | `DATETIME` | UTC Timestamp | Registration timestamp |

### B. `products` Table
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Internal Product ID |
| `sku` | `VARCHAR` | Unique, Not Null | Stock Keeping Unit |
| `name` | `VARCHAR` | Not Null | Commercial Product Name |
| `category` | `VARCHAR` | Not Null | Category (Electronics, Apparel, etc.) |
| `cost_price` | `FLOAT` | Not Null | Supplier Unit Cost ($) |
| `base_price` | `FLOAT` | Not Null | Baseline Manufacturer MSRP ($) |
| `current_price` | `FLOAT` | Not Null | Active Selling Price ($) |
| `min_price` | `FLOAT` | Not Null | Minimum Guardrail Bound ($) |
| `max_price` | `FLOAT` | Not Null | Maximum Guardrail Bound ($) |
| `target_margin`| `FLOAT` | Default: `40.0` | Target Gross Margin Percentage (%) |
| `stock_level` | `INTEGER` | Default: `100` | Current Inventory Count |
| `rating` | `FLOAT` | Default: `4.5` | Customer Star Rating (1-5) |

### C. `price_history` Table
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Audit Log Identifier |
| `product_id` | `INTEGER` | Foreign Key (`products.id`) | Target Product |
| `old_price` | `FLOAT` | Not Null | Previous Price ($) |
| `new_price` | `FLOAT` | Not Null | Updated Price ($) |
| `change_reason`| `VARCHAR`| Not Null | Reason (Competitor Match, Promotion, etc.) |
| `changed_by` | `VARCHAR` | Not Null | User / Engine who initiated price change |
| `created_at` | `DATETIME` | UTC Timestamp | Time of modification |

### D. `sales_records` Table
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Sales Entry ID |
| `product_id` | `INTEGER` | Foreign Key (`products.id`) | Target Product |
| `units_sold` | `INTEGER` | Not Null | Quantity Demanded |
| `unit_price` | `FLOAT` | Not Null | Price at transaction ($) |
| `discount_pct` | `FLOAT` | Default: `0.0` | Discount applied (%) |
| `revenue` | `FLOAT` | Not Null | Gross Sales ($) |
| `gross_profit` | `FLOAT` | Not Null | Revenue minus COGS ($) |
| `is_promotion` | `BOOLEAN` | Default: `False` | Active promotional campaign |
| `is_holiday` | `BOOLEAN` | Default: `False` | Public holiday flag |
| `sales_channel`| `VARCHAR` | Default: `Direct Web` | Sales channel |
| `recorded_date`| `VARCHAR` | Index, Not Null | Date string (YYYY-MM-DD) |

---

## 3. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Admin | Pricing Manager | Business Analyst |
| :--- | :---: | :---: | :---: |
| **View Analytics & Dashboards** | ✅ | ✅ | ✅ |
| **Inspect Product Catalog** | ✅ | ✅ | ✅ |
| **View Price History Audit Trail** | ✅ | ✅ | ✅ |
| **Modify Product Prices** | ✅ | ✅ | ❌ |
| **Create / Edit Products** | ✅ | ✅ | ❌ |
| **Configure Pricing Guardrails** | ✅ | ✅ | ❌ |
| **Manage Datasets & Seeding** | ✅ | ❌ | ❌ |
