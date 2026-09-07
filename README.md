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

## 🛠️ Tools & Technologies

| Category | Tools |
|---|---|
| Data Analysis | Python, Pandas, NumPy, Matplotlib, Seaborn |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), Passlib (bcrypt) |
| Frontend | Next.js, React, Tailwind CSS, TypeScript |
| Environment | VS Code, Jupyter Notebooks, Node.js |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

PRICEPILOT AI/
│
├── .venv/                          (excluded from Git)
├── venv/                           (excluded from Git)
│
├── data/
│   ├── raw/                        (excluded from Git)
│   └── processed_data/             (excluded from Git)
│
├── docs/
│   ├── ui_wireframes.md
│   └── pricing_workflows_objectives.md
│
├── notebooks/
│   ├── eda_retail_pricing.ipynb
│   ├── eda_dynamic_pricing.ipynb
│   ├── eda_online_retail_ii.ipynb
│   ├── eda_walmart_sales.ipynb
│   ├── eda_amazon_products.ipynb
│   └── eda_amazon_uk_products.ipynb
│
├── src/
│   ├── backend/
│   │   ├── venv/                  (excluded from Git)
│   │   ├── .env                  (excluded from Git — secrets)
│   │   │
│   │   └── app/
│   │       ├── main.py
│   │       ├── database.py
│   │       ├── create_tables.py
│   │       ├── models/ (user.py, product.py, pricing_history.py)
│   │       ├── routes/ (product.py, auth.py)
│   │       ├── schemas/ (product.py, user.py)
│   │       └── auth/ (auth_utils.py, dependencies.py)
│   │
│   └── frontend/
│       ├── node_modules/          (excluded from Git)
│       ├── .next/                  (excluded from Git)
│       ├── public/
│       ├── package.json, package-lock.json
│       ├── next.config.ts, tsconfig.json, eslint.config.mjs     postcss.config.mjs
│       │
│       └── app/
│           ├── page.tsx, layout.tsx, globals.css, favicon.ico
│           ├── login/page.tsx
│           ├── dashboard/page.tsx
│           └── lib/api.ts
│
├── .gitignore
└── README.md

## 📋 Additional Documentation

- **[Pricing Workflows & Objectives](docs/pricing_workflows_objectives.md)** — Detailed pricing optimization workflow and project objectives
- **[UI Wireframes & Workflow Planning](docs/ui_wireframes.md)** — Frontend design approach and page structure

---

## 🚧 Upcoming Work

- Price Prediction & Demand Forecasting models (Milestone 2)
- Competitor Analysis & Revenue Optimization modules (Milestone 3)
- Testing, Deployment & Documentation (Milestone 4)

---

## 👤 Author

**Sobhit Giri**
Infosys Springboard — PricePilot AI Project


