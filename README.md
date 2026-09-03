# PricePilot AI — Dynamic Pricing Optimization & Revenue Intelligence System

## Architecture (mapped from project brief, Section 3)

```
┌─────────────────────────────────────────────────────────────┐
│  ACCESS LAYER            frontend/  (Next.js + Tailwind)      │
│  Web dashboard, reports & insights, alerts                    │
└───────────────────────────────┬───────────────────────────────┘
                                 │  REST API (JSON)
┌───────────────────────────────▼───────────────────────────────┐
│  DECISION & ACTION LAYER   backend/app/services/pricing_engine │
│  Optimal price recommendation, scenario simulation             │
└───────────────────────────────┬───────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────┐
│  AI/ML CORE                backend/app/ml/                     │
│  Price Prediction · Demand Forecasting                         │
│  Competitor Analysis · Revenue Optimization                    │
└───────────────────────────────┬───────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────┐
│  DATA PIPELINE              backend/app/services/ingestion/    │
│  Ingestion → Cleaning → Transformation → Feature Engineering   │
└───────────────────────────────┬───────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────┐
│  DATA FOUNDATION            PostgreSQL (via SQLAlchemy)        │
│  data/raw/  data/processed/  backend/app/ml/saved_models/      │
└─────────────────────────────────────────────────────────────┘

  PLATFORM LAYER: docker-compose.yml (local only — no cloud, by design)
```

## Folder structure

```
pricepilot-ai/
├── backend/               FastAPI application
│   ├── app/
│   │   ├── api/routes/    One file per feature (auth, products, pricing, forecasting...)
│   │   ├── core/          config.py, database.py — shared infrastructure
│   │   ├── models/        SQLAlchemy ORM models (DB tables)
│   │   ├── schemas/       Pydantic schemas (request/response validation)
│   │   ├── services/      Business logic, incl. ingestion/ and pricing_engine/
│   │   ├── ml/            Model training scripts + saved_models/
│   │   └── main.py        App entrypoint
│   ├── alembic/           DB migrations (version-controlled schema changes)
│   ├── requirements.txt
│   └── .env.example
├── frontend/               Next.js application
│   └── app/                Pages (App Router)
├── data/
│   ├── raw/                 Original Kaggle/UCI files, untouched
│   └── processed/           Cleaned data after ingestion pipeline runs
├── docs/                     Architecture notes, milestone write-ups
└── docker-compose.yml       Local orchestration (Postgres + backend + frontend)
```

## Module → Code mapping (from project brief Section 4)

| # | Module | Code location |
|---|---|---|
| 1 | User Management | `backend/app/api/routes/auth.py`, `models/models.py::User` |
| 2 | Product & Pricing Data | `models/models.py::Product, PriceHistory`, `services/ingestion/` |
| 3 | Price Prediction | `app/ml/price_prediction.py` |
| 4 | Demand Forecasting | `app/ml/demand_forecasting.py`, `models/models.py::DemandForecast` |
| 5 | Competitor Analysis | `models/models.py::CompetitorPrice`, `app/services/competitor_analysis.py` |
| 6 | Revenue Optimization | `app/services/pricing_engine/` |
| 7 | Pricing Analytics Dashboard | `frontend/app/dashboard/` |

## Datasets (see `/docs` for the full selection rationale)

1. **Retail Price Optimization** (Kaggle) — pricing + competitor data
2. **Online Retail II** (UCI) — 2 years of real transactions
3. **Rossmann Store Sales** (Kaggle) — 2.5 years daily sales, promos, holidays

## Local development (no cloud)

Backend: `cd backend && uvicorn app.main:app --reload` → http://localhost:8000
Frontend: `cd frontend && npm run dev` → http://localhost:3000
Full stack via Docker: `docker compose up --build`
# PricePilot-AI-
