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
- Role-Based Access Control (RBAC) — only the Admin role can create, edit or delete products
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
| Demand Forecast, corrected (Gradient Boosting) | `units_sold` | R² = 0.48 | Leakage removed (`demand_index` was a hidden discount proxy). **This is the model the API currently serves** |
| Demand Forecast, time-series (Prophet) | `units_sold` (30-day, reference product P1001) | MAE 1.64 units | 41% better than baseline; 85.5% avg. forecast confidence |

- **Price Recommendation Engine** — simulates discount scenarios and recommends the revenue-maximizing price using price elasticity learned by the demand model
- **Short-term, medium-term, and long-term** demand forecasts generated via Prophet
- **Trend classification** (Increasing / Stable / Decreasing Demand)

### 2. Advanced Model Selection

- Compared 5 algorithms (Linear Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost) on the demand forecasting problem
- Random Forest selected as best performer, then tuned via **GridSearchCV** (3-fold CV, 18 combinations)
- Tuned model: R² = 0.8031, MAE = 2.64 units, saved as `demand_forecast_model_tuned.pkl`. It is not yet wired into the API (see Milestone 4)

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

### 5. Mentor Checklist (Extended Requirements)

- **Role-based access:** 3 roles (Admin, Business Analyst, User) with JWT authentication, server-side route protection, and role-aware navigation and controls
- **KPIs, price prediction page, demand forecasting page** with confidence bounds
- **AI alerts and recommendations** from an external LLM (Groq)
- **Downloadable business intelligence reports** (PDF)
- **Creative additions:** see the Add-ons section below

---

## ✨ Add-ons & Enhancements

Features built beyond the original milestone plan:

| Add-on | Where | Available to | What it does |
|---|---|---|---|
| Admin Governance Console | `/admin` | Admin | Live system diagnostics (database health check), product catalog management, user account management, restock approvals |
| Analyst Workbench | `/analyst` | Admin, Business Analyst | Revenue trajectory, regional performance cards, product intelligence with a 7/30/90-day horizon, and a what-if discount simulator |
| Stock & Alerts | `/inventory` | All roles | Stock health bars (low / healthy / surplus), per-product price check, AI stock advice, restock requests |
| Restock workflow | `/restock` API | All roles request, Admin approves | Approval adds the quantity to inventory; users see only their own requests |
| AI assistant | Floating widget, every page | All roles | Groq chatbot grounded in live business data, with suggested questions and clickable links to the relevant page |
| AI alerts | `/dashboard` | All roles | Rule-based alerts: negative growth, low revenue retention, extreme competitor price gaps |
| PDF reports | `/executive`, `/kpis`, `/competitor` | Admin, Business Analyst | Downloadable reports generated in the browser |
| Light / dark mode | Sidebar and login page | All roles | Theme toggle, remembered between visits |
| Calendar | `/calendar` | All roles | Live digital clock with day, date and month, month view, per-user tasks, `.ics` export |
| Navigation and loading | All pages | All roles | Role-aware sidebar and skeleton loaders |
| Unseen-product fallback | `POST /predictions/recommend-price` | — | Uses a generic encoding for categories or brands not in the training data, returns an `estimated` flag shown as a warning in the UI. `GET /predictions/valid-values` lists the values the model knows |

### Security and access control

- Public registration always creates the base **User** role
- Only an Admin can create accounts, change roles, deactivate or delete users, and an Admin cannot delete their own account
- Deactivated accounts cannot log in (HTTP 403)
- Passwords are hashed with bcrypt; JWTs are signed with a key stored in `.env`
- `.env`, datasets and trained model files are excluded from Git

---

## 🔐 Roles & Permissions

| Capability | Admin | Business Analyst | User |
|---|:---:|:---:|:---:|
| Product catalog, price recommendation, demand forecast, alerts | ✅ | ✅ | ✅ |
| Stock & Alerts, create restock requests, calendar | ✅ | ✅ | ✅ |
| KPIs, competitor analysis, executive report, Analyst Workbench, PDF reports | ✅ | ✅ | ❌ |
| Create / edit / delete products | ✅ | ❌ | ❌ |
| Approve / reject restock requests | ✅ | ❌ | ❌ |
| User management, system diagnostics | ✅ | ❌ | ❌ |

---

## 📊 Milestone 4: Testing, Deployment & Documentation 🔄

**Status: In progress**

| Task | Status | Notes |
|---|---|---|
| Validate prediction accuracy | ✅ Done | Leakage checks, product-level split, time-based holdout for Prophet, 3-fold cross-validation (see the notebooks) |
| Validate recommendation quality | 🔄 Partial | Manually checked; results are flagged as estimates when a product is outside the training data. No formal back-test yet |
| Optimize pricing algorithms | 🔄 Partial | Tuned Random Forest (R² 0.80) is saved but the API still serves the Gradient Boosting model (R² 0.48). Switching is a small change |
| Dashboard responsiveness | 🔄 Partial | Skeleton loaders added. KPI and alert endpoints re-read the dataset on every request, so caching is planned |
| Testing | 🔄 Manual | Every endpoint and role was tested by hand through the API docs and the UI. No automated test suite yet |
| Containerize with Docker | ❌ Not started | |
| Cloud deployment (AWS / Azure) | ❌ Not started | |
| Final documentation | 🔄 In progress | README and `docs/` updated |
| Final presentation and live demo | ❌ Pending | |

---

## ⚠️ Known Limitations

- The product listing, alerts, forecast, price recommendation, AI chat and AI insights endpoints do not require login yet, and the chatbot can quote business figures to any user
- The Prophet forecast is trained on one reference product (P1001), so it changes with the horizon but not with the selected product
- Calendar tasks are stored in the browser and are not shared between users or devices
- Approving a restock request adds the stock immediately, which simulates the goods arriving

---

## 🚀 Getting Started

1. Install PostgreSQL 17 and create a database named `pricepilot_ai`.
2. Backend: `cd src/backend`, create a venv, run `pip install -r requirements.txt`, then create a file named `.env` in `src/backend` with these variables: `DATABASE_URL` (your PostgreSQL connection string), `SECRET_KEY` (a long random string), `ALGORITHM` (HS256), `ACCESS_TOKEN_EXPIRE_MINUTES` (60) and `GROQ_API_KEY` (your own key).
3. Create tables: `python -m app.create_tables`
4. Download the datasets from the Kaggle links above into `data/raw/`, then run the notebooks in `notebooks/`. They produce the cleaned files in `data/processed_data/` and the trained models. These are excluded from Git because of their size.
5. Copy the trained models (`price_prediction_model.pkl`, `demand_forecast_model_final.pkl`, `label_encoders.pkl`, `prophet_demand_model.pkl`) into `src/backend/app/ml_models/`.
6. Start the API: `uvicorn app.main:app --reload`
7. Frontend: `cd src/frontend`, `npm install`, `npm run dev`
8. Promote your first Admin in the database: `UPDATE users SET role = 'Admin' WHERE username = '<your username>';`

---

## 🛠️ Tools & Technologies

| Category | Tools |
|---|---|
| Data Analysis | Python, Pandas, NumPy, Matplotlib, Seaborn |
| Machine Learning | scikit-learn, XGBoost, Prophet |
| LLM Integration | Groq API (`openai/gpt-oss-120b`) |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), Passlib (bcrypt) |
| Frontend | Next.js, React, Tailwind CSS, TypeScript, Recharts, jsPDF |
| Environment | VS Code, Jupyter Notebooks, Node.js |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

    PRICEPILOT AI/
    ├── data/
    │   ├── raw/                         (excluded from Git)
    │   └── processed_data/              (excluded from Git)
    ├── models/                          (trained ML models, excluded from Git)
    ├── docs/
    │   ├── ui_wireframes.md
    │   └── pricing_workflows_objectives.md
    ├── notebooks/
    │   ├── eda_*.ipynb                  (6 EDA notebooks, one per dataset)
    │   ├── price_prediction_model.ipynb
    │   └── competitor_analysis.ipynb
    ├── src/
    │   ├── backend/
    │   │   ├── .env                     (excluded from Git)
    │   │   ├── requirements.txt
    │   │   └── app/
    │   │       ├── main.py, database.py, create_tables.py
    │   │       ├── ml_models/           (excluded from Git)
    │   │       ├── models/              (user, product, pricing_history, restock_request)
    │   │       ├── routes/              (auth, product, predictions, restock)
    │   │       ├── schemas/             (user, product)
    │   │       └── auth/                (auth_utils, dependencies)
    │   └── frontend/
    │       └── app/
    │           ├── login, dashboard, forecasting, kpis, competitor, executive
    │           ├── admin, analyst, inventory, calendar
    │           ├── components/          (ChatWidget, Sidebar, Skeleton, ThemeToggle)
    │           └── lib/api.ts
    ├── requirements.txt
    ├── .gitignore
    └── README.md

## 📋 Additional Documentation

- **[Pricing Workflows & Objectives](docs/pricing_workflows_objectives.md)** — Detailed pricing optimization workflow and project objectives
- **[UI Wireframes & Workflow Planning](docs/ui_wireframes.md)** — Frontend design approach and page structure

---

## 🚧 Upcoming Work

- Containerize the backend and frontend with Docker
- Deploy to a cloud environment (AWS or Azure)
- Serve the tuned Random Forest demand model and add caching to the KPI endpoints
- Require login on the remaining open endpoints and give the chatbot role-aware context
- Add an automated test suite
- Final presentation and live demonstration

---

## 👤 Author

**Sobhit Giri**
Infosys Springboard — PricePilot AI Project