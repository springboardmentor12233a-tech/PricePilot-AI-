# PricePilot AI

### Dynamic Pricing Optimization & Revenue Intelligence System

An AI-powered platform that helps businesses optimize product prices based on market demand, competitor pricing, customer behavior, and sales performance — supporting price prediction, demand forecasting, competitor analysis, and revenue optimization through a centralized platform.

---

## 🎯 Project Objective

Build an AI-powered dynamic pricing platform that maximizes revenue, improves profitability, enhances market competitiveness, and supports intelligent pricing decisions using machine learning — applicable across e-commerce, retail, marketplaces, airlines, hotels, subscription platforms, and sales teams.

---

## 📊 Milestone 1: Data Collection, EDA, Backend & Frontend ✅

**Status: Completed**

### 1. Data Collection, EDA & Preprocessing

| # | Dataset | Source | Purpose |
|---|---------|--------|---------|
| 1 | Retail Pricing & Demand Signals | [Kaggle](https://www.kaggle.com/datasets/noopurbhatt/retail-pricing-and-demand-signals-dataset) | Retail pricing patterns |
| 2 | Dynamic Pricing Dataset | [Kaggle](https://www.kaggle.com/datasets/arashnic/dynamic-pricing-dataset) | Core dynamic pricing mechanics |
| 3 | Online Retail II (UCI) | [Kaggle](https://www.kaggle.com/datasets/mashlyn/online-retail-ii-uci) | E-commerce sales & customer behavior |
| 4 | Walmart Dataset | [Kaggle](https://www.kaggle.com/datasets/yasserh/walmart-dataset) | Historical sales, inventory & market/economic data |
| 5 | Amazon Products 2023 | [Kaggle](https://www.kaggle.com/datasets/asaniczka/amazon-products-dataset-2023-1-4m-products) | Product catalog & attributes |
| 6 | Amazon UK Products 2023 | [Kaggle](https://www.kaggle.com/datasets/asaniczka/amazon-uk-products-dataset-2023) | Competitor pricing data |

- Sourced and cleaned 6 real-world datasets (~4.8 million records)
- Full EDA: structure inspection, missing values, duplicates, statistics, validity checks
- Individual charts + combined dashboards per dataset
- Cleaned, analysis-ready datasets exported for ML use

### 2. Backend (FastAPI + PostgreSQL)

- RESTful API built with **FastAPI**, connected to a **PostgreSQL** database
- Database models: `users`, `products`, `pricing_history`
- Full Product CRUD (Create, Read, Update, Delete)
- User registration & login with hashed passwords (bcrypt)
- JWT-based authentication
- Role-Based Access Control (RBAC) — Pricing Manager / Executive roles required for write operations
- Automatic pricing history logging on every price change
- Secrets managed via `.env` (excluded from version control)

### 3. Frontend (Next.js + Tailwind CSS)

- Built with **Next.js** (App Router) and **Tailwind CSS**
- Custom dark, terminal-inspired UI theme (emerald/violet accents, glass-effect cards)
- **Login page** — connected to backend authentication, JWT stored client-side
- **Dashboard page** — displays live product data fetched from PostgreSQL via the backend API, shows authenticated user identity and role

---

## 📊 Milestone 2: Price Prediction & Demand Forecasting ✅

**Status: Completed**

### 1. Model Development (Jupyter Notebook)

Built and honestly validated in `notebooks/price_prediction_model.ipynb`, including detection and correction of **3 separate data leakage issues** along the way:

| Model | Target | Result | Notes |
|---|---|---|---|
| Price Prediction (Random Forest) | `current_price` | R² = 0.99 | Legitimate — driven by `base_price` + `promotion_type` |
| Discount Strategy (Random Forest) | `discount_pct` | R² = 0.29 | Genuine finding: historical discounting was calendar-driven, not demand-responsive |
| Demand Forecast, corrected (Gradient Boosting) | `units_sold` | R² = 0.48 | Leakage removed (`demand_index` was a hidden discount proxy) |
| Demand Forecast, time-series (Prophet) | `units_sold` (30-day) | MAE 1.64 units | 41% better than baseline; 85.5% avg. forecast confidence |

- **Price Recommendation Engine** — simulates discount scenarios and recommends the revenue-maximizing price using genuine price elasticity
- **Short-term, medium-term, and long-term** demand forecasts generated via Prophet
- **Trend classification** (Increasing / Stable / Decreasing Demand)

### 2. Advanced Model Selection

- Compared 5 algorithms (Linear Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost) on the demand forecasting problem
- Random Forest selected as best performer, then tuned via **GridSearchCV** (3-fold CV, 18 combinations)
- Final tuned model: R² = 0.8031, MAE = 2.64 units

### 3. Backend — ML Model Serving

- **POST /predictions/recommend-price** — price/discount scenarios and revenue-optimal recommendation
- **GET /predictions/demand-forecast?days=N** — demand forecast (7/14/30/90/365-day horizons) with confidence bounds and trend classification
- **GET /predictions/kpis** — key business metrics (revenue, growth, category/regional performance)
- **POST /predictions/ai-insights** — AI-generated business insights via **Groq API** (`openai/gpt-oss-120b`)

### 4. Frontend — Forecasting & KPI Dashboards

- **`/forecasting`** page — demand forecast chart with confidence bands, horizon selector, price recommendation curve
- **`/kpis`** page — revenue trend, category/regional performance charts, and an AI-powered "Generate Insight" panel

---

## 📊 Milestone 3: Competitor Analysis & Revenue Optimization ✅

**Status: Completed**

### 1. Competitor Analysis (Jupyter Notebook)

Built in `notebooks/competitor_analysis.ipynb`, comparing the platform's own product pricing against real competitor data:

- Mapped 8 internal product categories to relevant categories within the **Amazon UK Products** dataset (curated manually after filtering out noisy keyword-matched and catch-all categories)
- Compared pricing using **median** (not mean) competitor price to remain robust against extreme outliers (competitor dataset ranges from £0.01 to £100,000)
- **Finding:** Own products are positioned "Above Market" across all 8 categories, with premium gaps ranging from 217% to 1,796% versus competitor median pricing — a genuine market positioning insight
- Generated rule-based **pricing strategy recommendations** per category based on gap severity

### 2. Profitability Analytics

- Calculated **revenue retention %** (percentage of full-price revenue retained after discounting) and **margin erosion** ($ lost to discounting) per category
- Identified Electronics as the category with the weakest revenue retention (84.7%)

### 3. Backend — Competitor & Profitability API

- **GET /predictions/competitor-analysis** — price positioning and strategy recommendations by category
- **GET /predictions/profitability** — revenue retention and margin erosion analytics by category

### 4. Frontend — Competitor & Executive Dashboards

- **`/competitor`** page — price positioning bar chart (own vs. competitor median), strategy recommendation cards, revenue retention chart
- **`/executive`** page — consolidated executive summary combining KPIs, competitive position, and profitability into a single view, with an AI-generated (Groq) executive briefing and a category performance summary table

---

## 🛠️ Tools & Technologies

| Category | Tools |
|---|---|
| Data Analysis | Python, Pandas, NumPy, Matplotlib, Seaborn |
| Machine Learning | scikit-learn, XGBoost, Prophet |
| LLM Integration | Groq API (`openai/gpt-oss-120b`) |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), Passlib (bcrypt) |
| Frontend | Next.js, React, Tailwind CSS, TypeScript, Recharts |
| Environment | VS Code, Jupyter Notebooks, Node.js |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

PRICEPILOT AI/
│
├── data/
│ ├── raw/ (excluded from Git)
│ └── processed_data/ (excluded from Git — includes competitor_analysis_results.csv, profitability_analysis.csv)
│
├── models/ (trained ML models — excluded from Git, regenerate via notebook)
│
├── docs/
│ ├── ui_wireframes.md
│ └── pricing_workflows_objectives.md
│
├── notebooks/
│ ├── eda_retail_pricing.ipynb
│ ├── eda_dynamic_pricing.ipynb
│ ├── eda_online_retail_ii.ipynb
│ ├── eda_walmart_sales.ipynb
│ ├── eda_amazon_products.ipynb
│ ├── eda_amazon_uk_products.ipynb
│ ├── price_prediction_model.ipynb
│ └── competitor_analysis.ipynb
│
├── src/
│ ├── backend/
│ │ ├── .env (excluded from Git — DB password, JWT secret, Groq API key)
│ │ └── app/
│ │ ├── main.py
│ │ ├── database.py
│ │ ├── create_tables.py
│ │ ├── ml_models/ (excluded from Git — trained model files)
│ │ ├── models/ (user.py, product.py, pricing_history.py)
│ │ ├── routes/ (product.py, auth.py, predictions.py)
│ │ ├── schemas/ (product.py, user.py)
│ │ └── auth/ (auth_utils.py, dependencies.py)
│ │
│ └── frontend/
│ └── app/
│ ├── page.tsx, layout.tsx, globals.css, favicon.ico
│ ├── login/page.tsx
│ ├── dashboard/page.tsx
│ ├── forecasting/page.tsx
│ ├── kpis/page.tsx
│ ├── competitor/page.tsx
│ ├── executive/page.tsx
│ └── lib/api.ts
│
├── .gitignore
└── README.md


## 📋 Additional Documentation

- **[Pricing Workflows & Objectives](docs/pricing_workflows_objectives.md)** — Detailed pricing optimization workflow and project objectives
- **[UI Wireframes & Workflow Planning](docs/ui_wireframes.md)** — Frontend design approach and page structure

---

## 🚧 Upcoming Work

- Testing, Deployment & Documentation (Milestone 4)

---

## 👤 Author

**Sobhit Giri**
Infosys Springboard — PricePilot AI Project 