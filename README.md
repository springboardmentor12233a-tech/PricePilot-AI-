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
| Demand Forecast, corrected (Gradient Boosting) | `units_sold` | R² = 0.48 | Leakage removed (`demand_index` was a hidden discount proxy); `discount_pct` now shows real predictive importance |
| Demand Forecast, time-series (Prophet) | `units_sold` (30-day) | MAE 1.64 units | 41% better than a 7-day moving-average baseline; 85.5% avg. forecast confidence |

- **Price Recommendation Engine** — simulates discount scenarios (0–50%), predicts resulting demand, and recommends the revenue-maximizing price point using genuine, leak-free price elasticity
- **Short-term (7/14/30-day), medium-term (90-day), and long-term (365-day)** demand forecasts generated via Prophet, with honestly widening confidence intervals for longer horizons
- **Trend classification** (Increasing / Stable / Decreasing Demand) based on forecast comparison
- Trained models saved to `models/` for reuse

### 2. Backend — ML Model Serving

- New `/predictions` API routes (`src/backend/app/routes/predictions.py`) load the trained models and serve live predictions
- **POST /predictions/recommend-price** — returns price/discount scenarios and the revenue-optimal recommendation for a given product
- **GET /predictions/demand-forecast?days=N** — returns a demand forecast (7/14/30/90/365-day horizons) with confidence bounds and trend classification

### 3. Frontend — Forecasting Dashboard

- New `/forecasting` page (`src/frontend/app/forecasting/page.tsx`) built with **Recharts**
- Interactive demand forecast chart with confidence interval band and selectable horizon (7d/14d/30d/90d)
- Trend and % change indicators
- Price recommendation panel with a revenue-vs-discount curve and a highlighted optimal price card

---

## 🛠️ Tools & Technologies

| Category | Tools |
|---|---|
| Data Analysis | Python, Pandas, NumPy, Matplotlib, Seaborn |
| Machine Learning | scikit-learn, XGBoost, Prophet |
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
│ └── processed_data/ (excluded from Git)
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
│ └── price_prediction_model.ipynb
│
├── src/
│ ├── backend/
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
│ └── lib/api.ts
│
├── .gitignore
└── README.md


## 📋 Additional Documentation

- **[Pricing Workflows & Objectives](docs/pricing_workflows_objectives.md)** — Detailed pricing optimization workflow and project objectives
- **[UI Wireframes & Workflow Planning](docs/ui_wireframes.md)** — Frontend design approach and page structure

---

## 🚧 Upcoming Work

- Competitor Analysis & Revenue Optimization modules (Milestone 3)
- Testing, Deployment & Documentation (Milestone 4)

---

## 👤 Author

**Sobhit Giri**
Infosys Springboard — PricePilot AI Project