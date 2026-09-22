# PricePilot AI — Dynamic Pricing Optimization & Revenue Intelligence System

> **An AI-powered pricing intelligence platform for demand prediction, competitor analysis, revenue optimization, and data-driven pricing decisions.**

[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange)](https://xgboost.readthedocs.io/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Assistant-4285F4?logo=google)](https://ai.google.dev/)

---

## 1. Project Overview

**PricePilot AI** is an end-to-end **Dynamic Pricing Optimization & Revenue Intelligence System** designed to help businesses make data-driven pricing decisions.

The system combines:

* Machine Learning-based demand prediction
* Dynamic pricing intelligence
* Competitor price analysis
* Inventory intelligence
* Revenue optimization
* Pricing analytics
* Sales analytics
* AI-powered business assistance
* Multi-user and organization management

The core ML engine uses a **tuned XGBoost regression model** to predict product demand from pricing, inventory, competitor, seasonal, promotional, and market-related features.

The platform exposes the ML and business functionality through a **FastAPI backend**, stores application data in **PostgreSQL**, and provides an interactive **React-based enterprise dashboard**.

---

# 2. Problem Statement

Traditional pricing decisions often rely on:

* Historical averages
* Manual competitor monitoring
* Static pricing rules
* Limited demand analysis
* Spreadsheet-based calculations
* Human intuition

These approaches can make it difficult to respond quickly to changes in:

* Customer demand
* Competitor pricing
* Inventory levels
* Promotions
* Seasonality
* Market conditions

PricePilot AI addresses this problem by combining historical data, machine learning, competitor intelligence, and pricing analytics into a unified platform.

---

# 3. Objectives

The primary objectives of PricePilot AI are to:

1. Predict product demand using machine learning.
2. Analyze pricing and competitor relationships.
3. Monitor competitor prices.
4. Provide pricing intelligence and recommendations.
5. Estimate revenue and gross-profit impact of pricing scenarios.
6. Analyze historical pricing performance.
7. Provide demand intelligence and forecasting capabilities.
8. Provide an AI assistant for pricing and business questions.
9. Provide an enterprise dashboard for business users.
10. Support organization-based multi-user access.

---

# 4. Key Features

## Authentication & User Management

* User registration
* Secure login
* JWT-based authentication
* Current-user information
* User profile management
* Protected application routes

## Organization Management

* Multiple organizations/workspaces
* Organization selection
* Organization members
* Role-aware access
* Organization-level data isolation

## Product Management

* Product catalog
* Product creation
* Product editing
* Product deletion
* Product variants
* Categories
* SKU management
* Cost and selling price information

## Inventory Intelligence

* Inventory visibility
* Inventory updates
* Stock-related pricing context
* Product-level inventory information

## Competitor Intelligence

* Competitor management
* Competitor product matching
* Competitor price observations
* Competitor price history
* Price comparison
* Competitive positioning

## Demand Intelligence

* ML-based demand prediction
* Product-level demand analysis
* Demand trends
* Forecasting interface
* Forecast horizon selection
* Historical demand analysis

## Pricing Intelligence

* Pricing prediction
* Pricing recommendations
* Pricing history
* Competitor-aware pricing analysis
* Explicit recommendation application

## Revenue Optimization

The platform can evaluate pricing scenarios using:

### Expected Revenue

```text
Expected Revenue =
Price × Predicted Demand × (1 - Discount / 100)
```

### Expected Gross Profit

```text
Expected Gross Profit =
Expected Revenue - (Cost Price × Predicted Demand)
```

### Gross Margin

```text
Gross Margin =
(Expected Gross Profit / Expected Revenue) × 100
```

The system keeps user-defined scenarios separate from AI-generated recommendations.

## Pricing Analytics

* Revenue analysis
* Demand analysis
* Price history
* Discount analysis
* Competitor positioning
* Product-level pricing performance
* Sales analytics

## AI Assistant

PricePilot AI includes a Gemini-powered conversational assistant.

Users can ask questions about:

* Pricing
* Demand
* Competitors
* Revenue
* Gross margin
* Forecasting
* Pricing analytics
* Business concepts

The frontend communicates with the FastAPI backend, which handles the Gemini integration.

```text
React Frontend
      ↓
FastAPI
      ↓
Gemini API
      ↓
AI Response
      ↓
PricePilot AI Chat Interface
```

API credentials are kept on the backend and are not exposed to the browser.

---

# 5. Machine Learning

## Dataset

The project uses an Amazon sales dataset containing approximately **76,000 records**.

After preprocessing, the dataset contains:

* 76,000 observations
* 5 stores
* 20 products
* 760 unique dates
* 100 observations per date
* 100 Store × Product combinations

The dataset covers:

```text
2022-01-01 → 2024-01-30
```

## Target Variable

The primary ML target is:

```text
Demand
```

`Units Sold` and `Revenue` are not used as direct input features for demand prediction because they represent outcomes that can introduce leakage when predicting demand.

---

# 6. Feature Engineering

The model uses pricing, inventory, market, temporal, categorical, and cyclical features.

### Categorical Features

```text
Store ID
Product ID
Category
Region
Weather Condition
Seasonality
Price Position
```

### Numerical Features

```text
Inventory Level
Units Ordered
Price
Discount
Promotion
Competitor Pricing
Epidemic
Year
Month
Day
Price Difference
Relative Price Difference
Day of Week
Quarter
Week of Year
Month Sin
Month Cos
DayOfWeek Sin
DayOfWeek Cos
```

Total raw model features:

```text
26
```

---

# 7. Data Preprocessing

The ML preprocessing pipeline uses:

```text
Numerical Features
        ↓
StandardScaler

Categorical Features
        ↓
OneHotEncoder
        ↓
handle_unknown="ignore"

        ↓

ColumnTransformer
        ↓
Processed Model Features
```

The fitted preprocessing pipeline is saved together with the model to ensure that inference uses the same transformations as training.

---

# 8. Model Development

Multiple machine learning approaches were evaluated.

### Models Evaluated

* Linear Regression
* Ridge Regression
* Lasso Regression
* Decision Tree Regressor
* Random Forest Regressor
* XGBoost Regressor
* LSTM benchmark

The final production-oriented model is a tuned **XGBoost Regressor**.

---

# 9. Final XGBoost Model

The final configuration is:

```python
XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42,
    n_jobs=-1
)
```

## Final Evaluation

| Dataset    |   MAE |  RMSE |         R² |   MAPE |
| ---------- | ----: | ----: | ---------: | -----: |
| Training   | 11.61 | 16.15 |     0.8809 | 16.19% |
| Validation | 14.01 | 19.96 |     0.8285 | 17.45% |
| Test       | 12.43 | 17.24 | **0.8527** | 18.94% |

The final model achieved:

> **R² = 0.8527 on the held-out test dataset.**

This indicates that the model explains approximately **85.27% of the variance in the test-set demand values** under the project's evaluation setup.

**R² is a model evaluation metric, not a live prediction-confidence score.**

---

# 10. LSTM Benchmark

An LSTM-based sequence model was also evaluated as a deep-learning benchmark.

The LSTM performed below the final XGBoost model on the current dataset and feature setup.

Therefore, XGBoost was selected as the primary demand-prediction model for the current implementation.

The LSTM remains useful as a benchmark for future experimentation with richer sequential features and forecasting architectures.

---

# 11. ML Inference Architecture

The trained model is integrated with FastAPI.

```text
Frontend
   │
   ▼
FastAPI API
   │
   ▼
Request Validation
   │
   ▼
Feature Generation
   │
   ▼
Saved Preprocessor
   │
   ▼
XGBoost Model
   │
   ▼
Predicted Demand
   │
   ▼
Pricing Intelligence
   │
   ▼
API Response
```

The model artifact contains:

```text
model
preprocessor
features
model_name
version
```

The backend loads the artifact once and reuses it for inference.

---

# 12. Pricing Intelligence Architecture

XGBoost predicts **demand**, rather than directly predicting the optimal price.

The pricing workflow is:

```text
Product Data
      ↓
Demand Prediction
      ↓
Candidate Pricing Scenarios
      ↓
Predicted Demand
      ↓
Expected Revenue
      ↓
Expected Gross Profit
      ↓
Gross Margin
      ↓
Pricing Recommendation
```

This separation allows the demand model and pricing decision layer to remain independently interpretable.

---

# 13. System Architecture

```text
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │                     │
                         │ Dashboard           │
                         │ Products            │
                         │ Inventory           │
                         │ Competitors         │
                         │ Forecasting         │
                         │ Pricing             │
                         │ Analytics           │
                         │ AI Assistant        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │      Backend        │
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
       ┌───────────────┐    ┌───────────────┐    ┌──────────────┐
       │   Services    │    │  ML Engine    │    │  AI Services │
       │               │    │               │    │              │
       │ Pricing       │    │ XGBoost       │    │ Gemini       │
       │ Products      │    │ Preprocessor  │    │ Grok         │
       │ Competitors   │    │ Prediction    │    │              │
       │ Sales         │    │               │    │              │
       └───────┬───────┘    └───────────────┘    └──────────────┘
               │
               ▼
       ┌───────────────────┐
       │    PostgreSQL     │
       │                   │
       │ Organizations     │
       │ Users             │
       │ Products          │
       │ Inventory         │
       │ Competitors       │
       │ Prices            │
       │ Sales             │
       │ Recommendations   │
       └───────────────────┘
```

---

# 14. Backend Architecture

The backend follows a modular FastAPI architecture:

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── pricing_service.py
│   │   ├── product_service.py
│   │   ├── competitor_service.py
│   │   ├── sales_service.py
│   │   └── ai_service.py
│   │
│   └── ml/
│       ├── models/
│       ├── preprocessing/
│       └── inference/
│
├── saved_models/
│
├── tests/
│
├── alembic/
│
├── requirements.txt
│
└── Dockerfile
```

---

# 15. Database

PricePilot AI uses **PostgreSQL** with SQLAlchemy.

The database is designed around a multi-tenant architecture.

Major entities include:

```text
Organizations
Users
Roles
User Roles
Organization Members
Categories
Products
Product Variants
Inventory
Competitors
Competitor Products
Competitor Prices
Price History
Pricing Recommendations
Sales Records
Refresh Tokens
```

The database follows normalized relational design with foreign-key relationships and organization-level data separation.

---

# 16. API Architecture

The backend provides APIs covering:

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/token
GET  /api/v1/auth/me
```

### Users

```text
GET /api/v1/users/
GET /api/v1/users/{user_id}
PUT /api/v1/users/{user_id}
```

### Organizations

```text
GET  /api/v1/organizations/
POST /api/v1/organizations/
GET  /api/v1/organizations/{org_id}
POST /api/v1/organizations/{org_id}/members
```

### Products & Categories

```text
POST /api/v1/categories/
GET  /api/v1/categories/organization/{org_id}

POST   /api/v1/products/
GET    /api/v1/products/organization/{org_id}
GET    /api/v1/products/{product_id}
PUT    /api/v1/products/{product_id}
DELETE /api/v1/products/{product_id}
POST   /api/v1/products/{product_id}/variants
GET    /api/v1/products/{product_id}/inventory
PUT    /api/v1/products/{product_id}/inventory
```

### Competitors

```text
POST /api/v1/competitors/
GET  /api/v1/competitors/organization/{org_id}
PUT  /api/v1/competitors/{competitor_id}
POST /api/v1/competitors/match
POST /api/v1/competitors/prices
GET  /api/v1/competitors/product/{product_id}/prices
```

### Pricing

```text
POST /api/v1/pricing/predict
POST /api/v1/pricing/recommendations
POST /api/v1/pricing/recommendations/{recommendation_id}/apply
GET  /api/v1/pricing/history/{product_id}
```

### Sales

```text
POST /api/v1/sales/
GET  /api/v1/sales/analytics/{organization_id}
```

### AI

```text
POST /api/v2/ai/gemini
POST /api/v2/ai/grok
POST /api/v2/ai/predict
```

### System

```text
GET /
GET /health
```

> API availability should always be verified against the deployed FastAPI OpenAPI specification because endpoint availability can change during development.

---

# 17. Frontend

The frontend is built using:

* React
* Vite
* React Router
* Axios
* Tailwind CSS
* Lucide React
* Recharts
* Motion

The interface follows an enterprise SaaS design approach with:

* Responsive layouts
* Reusable components
* Dashboard analytics
* Data tables
* Charts
* Loading states
* Error states
* Empty states
* AI assistant
* Authentication
* Protected routes

---

# 18. Frontend Feature Architecture

```text
src/
│
├── components/
│   └── Global UI Components
│
├── hooks/
│   └── Global Hooks
│
├── layouts/
│   ├── DashboardLayout
│   └── Sidebar
│
├── features/
│   │
│   ├── authentication/
│   ├── dashboard/
│   ├── products/
│   ├── categories/
│   ├── inventory/
│   ├── competitors/
│   ├── forecasting/
│   ├── pricing/
│   ├── revenue-optimization/
│   ├── pricing-analytics/
│   ├── ai-assistant/
│   └── profile/
│
└── utils/
```

---

# 19. AI Assistant

The PricePilot AI assistant is powered by Gemini through the backend.

```text
User
 │
 ▼
AI Assistant
 │
 ▼
React API Client
 │
 ▼
FastAPI
 │
 ▼
Gemini
 │
 ▼
Natural-language response
 │
 ▼
Chat interface
```

The frontend displays only the AI response content rather than exposing the underlying API response envelope.

For example, the backend may return:

```json
{
  "id": "...",
  "model": "gemini-3.5-flash",
  "output": "The capital of India is **New Delhi**.",
  "metadata": null
}
```

The user sees:

> The capital of India is **New Delhi**.

API credentials remain server-side.

---

# 20. Security

Security considerations include:

* JWT authentication
* Protected routes
* Password hashing
* Environment-based secrets
* Organization-level access control
* API authorization
* No Gemini API key in frontend
* No database credentials in frontend
* `.env` excluded from Git
* ML artifacts excluded where appropriate
* Explicit action for pricing recommendation application

Sensitive configuration should be stored in environment variables and never committed to the repository.

---

# 21. Installation

## Prerequisites

Install:

* Python 3.13
* Node.js
* npm
* PostgreSQL
* Git

---

## Backend Setup

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate on Windows:

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables:

```text
DATABASE_URL=...
SECRET_KEY=...
GEMINI_API_KEY=...
```

Run the backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

OpenAPI:

```text
http://localhost:8000/openapi.json
```

---

# 22. Frontend Setup

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the frontend environment configuration:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Run:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 23. ML Model

The trained XGBoost model is stored as a serialized artifact containing the trained model and preprocessing pipeline.

Recommended structure:

```text
backend/
└── saved_models/
    └── pricepilot_xgboost_model.pkl
```

or the project's configured ML artifact location.

The model artifact should generally **not be committed to Git** if it is large or contains deployment-sensitive artifacts.

Add to `.gitignore`:

```gitignore
*.pkl
*.pickle
*.joblib
```

---

# 24. Model Inference

Example inference flow:

```python
features = {
    "Store ID": "S001",
    "Product ID": "P001",
    "Category": "Clothing",
    "Region": "North",
    "Inventory Level": 120,
    "Units Ordered": 100,
    "Price": 4999,
    "Discount": 10,
    "Weather Condition": "Sunny",
    "Promotion": 1,
    "Competitor Pricing": 4799,
    "Seasonality": "Summer",
    "Epidemic": 0,
    "Year": 2024,
    "Month": 7,
    "Day": 15,
    "Price Difference": 200,
    "Relative Price Difference": 0.0417,
    "Price Position": "Premium",
    "Day of Week": 0,
    "Quarter": 3,
    "Week of Year": 29,
    "Month Sin": -0.5,
    "Month Cos": -0.866,
    "DayOfWeek Sin": 0,
    "DayOfWeek Cos": 1
}
```

The backend then:

```text
Validate features
       ↓
Arrange feature order
       ↓
Apply fitted preprocessing
       ↓
XGBoost inference
       ↓
Predicted demand
```

---

# 25. Testing

Testing covers:

### Backend

* API endpoint validation
* Authentication
* Database operations
* ML inference
* AI integration
* Error handling

### Frontend

* Route protection
* Forms
* API integration
* Dashboard rendering
* Charts
* Responsive design
* AI assistant
* Loading/error/empty states

### ML

* Train/validation/test separation
* MAE
* RMSE
* R²
* MAPE
* Overfitting analysis

---

# 26. Model Evaluation Methodology

The dataset was divided chronologically rather than randomly to reduce temporal leakage.

```text
70% → Training
15% → Validation
15% → Test
```

Date ranges:

```text
Training:
2022-01-01 → 2023-06-16

Validation:
2023-06-17 → 2023-10-08

Test:
2023-10-09 → 2024-01-30
```

This preserves temporal ordering during evaluation.

---

# 27. Important ML Considerations

The current XGBoost model is primarily a **demand prediction model**.

It should not automatically be interpreted as a causal pricing elasticity model.

Observed relationships between price and demand do not by themselves establish causal effects because pricing decisions may be influenced by other business factors.

Similarly:

```text
R² ≠ prediction confidence
```

and:

```text
Demand prediction ≠ native time-series forecast
```

Future forecasting requires careful treatment of unknown future variables such as:

* Future price
* Competitor price
* Promotions
* Inventory
* Weather
* Market conditions

---

# 28. Current Project Status

### Completed / Implemented

* Dataset preparation
* EDA
* Feature engineering
* ML preprocessing
* Multiple model evaluation
* XGBoost model development
* Final XGBoost model
* FastAPI backend foundation
* PostgreSQL database
* Authentication
* Product management
* Inventory management
* Competitor management
* Pricing architecture
* Sales analytics
* Gemini integration
* Custom ML prediction endpoint
* React dashboard
* Pricing intelligence interface
* Demand intelligence interface
* Revenue optimization interface
* Pricing analytics interface
* AI assistant interface

### Ongoing / Future Enhancement

* More rigorous time-series forecasting
* Advanced pricing optimization
* Automated competitor data ingestion
* Model monitoring
* Automated retraining
* Advanced explainability
* Load testing
* Cloud deployment
* CI/CD
* Production observability

---

# 29. Future Scope

Future development can include:

### Advanced Forecasting

* Prophet
* ARIMA
* XGBoost time-series models
* LSTM/Transformer forecasting
* Hierarchical forecasting

### Advanced Pricing Optimization

* Price elasticity estimation
* Constrained optimization
* Bayesian optimization
* Reinforcement learning
* Multi-objective optimization

### MLOps

* Model registry
* Automated retraining
* Model drift detection
* Feature drift monitoring
* Experiment tracking
* Model versioning

### Infrastructure

* Docker
* AWS deployment
* Redis caching
* Background workers
* Load balancing
* CI/CD
* Centralized logging
* Monitoring

---

# 30. Limitations

The current system has several important limitations:

1. The XGBoost model predicts demand but does not independently establish causal price elasticity.
2. Some future forecasting inputs may not be known in advance.
3. Competitor intelligence depends on available competitor observations.
4. AI responses depend on the configured Gemini service and available context.
5. Production-scale capacity requires load testing rather than assumptions.
6. Serialized ML artifacts should be versioned and deployed carefully because library-version compatibility can affect model loading.
7. Automated pricing should remain subject to business constraints and human approval until appropriate production validation is completed.

---

# 31. Project Structure

```text
PRICEPILOT_AI/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── saved_models/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── utils/
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

# 32. Technology Stack

| Layer             | Technologies                      |
| ----------------- | --------------------------------- |
| Frontend          | React, Vite, Tailwind CSS         |
| UI                | Lucide React, Motion              |
| Charts            | Recharts                          |
| HTTP Client       | Axios                             |
| Backend           | FastAPI                           |
| Language          | Python                            |
| Database          | PostgreSQL                        |
| ORM               | SQLAlchemy                        |
| Migrations        | Alembic                           |
| Authentication    | JWT                               |
| ML                | Scikit-learn, XGBoost             |
| Data Processing   | Pandas, NumPy                     |
| Visualization     | Matplotlib, Seaborn               |
| AI                | Google Gemini, xAI Grok           |
| API Documentation | FastAPI Swagger/OpenAPI           |
| Deployment        | Docker / Cloud-ready architecture |

---

# 33. Project Outcomes

PricePilot AI demonstrates an end-to-end implementation of a modern AI-enabled business application:

```text
Raw Business Data
       ↓
Data Cleaning
       ↓
Exploratory Data Analysis
       ↓
Feature Engineering
       ↓
Machine Learning
       ↓
Demand Prediction
       ↓
Pricing Intelligence
       ↓
Revenue Analysis
       ↓
Competitor Intelligence
       ↓
AI Assistance
       ↓
Business Decision Support
```

The project combines **machine learning, backend engineering, database design, frontend development, API architecture, and generative AI** into a single integrated platform.

---

# 34. Academic Project Information

**Project:** PricePilot AI
**Domain:** Artificial Intelligence / Machine Learning / Full-Stack Development
**Type:** Major Project / Final Year Project
**Student:** Aditya Raj Pandey
**Program:** B.Tech — Computer Science & Engineering (Artificial Intelligence & Machine Learning)
**Institution:** Pranveer Singh Institute of Technology, Kanpur
**Expected Graduation:** 2027

---

# 35. Conclusion

**PricePilot AI** is designed as a complete pricing intelligence platform rather than a standalone machine-learning model.

The project integrates:

* Data science
* Machine learning
* XGBoost demand prediction
* FastAPI
* PostgreSQL
* React
* REST APIs
* Authentication
* Competitor intelligence
* Revenue optimization
* Business analytics
* Generative AI

The current XGBoost model achieved an **R² of 0.8527 on the held-out test dataset**, while the surrounding application provides the infrastructure required to turn model predictions into practical pricing and revenue-analysis workflows.

The architecture is designed to support future improvements in forecasting, pricing optimization, MLOps, monitoring, and cloud deployment.

---

## Author

**Aditya Raj Pandey**

B.Tech CSE — Artificial Intelligence & Machine Learning
Pranveer Singh Institute of Technology, Kanpur

