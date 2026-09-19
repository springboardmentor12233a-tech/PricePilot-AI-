# PricePilot AI

## Dynamic Pricing Optimization & Revenue Intelligence System

> An AI-powered platform for demand prediction, dynamic pricing intelligence, competitor analysis, revenue optimization, and business intelligence.

PricePilot AI is an **AI/ML-powered full-stack business intelligence platform** designed to help businesses make data-driven pricing decisions.

The system combines:

* Historical sales data
* Product information
* Pricing data
* Discounts
* Promotions
* Inventory conditions
* Competitor pricing
* Seasonal patterns
* Market signals
* Machine Learning
* Revenue simulation
* Business intelligence

to predict product demand and support intelligent pricing and revenue decisions. 

The current machine-learning experimentation identified **XGBoost Regressor** as the strongest tested demand prediction model, achieving:

```text
Test R²   = 0.8527
MAE       = 12.43
RMSE      = 17.24
MAPE      = 18.94%
```

on the held-out chronological test set. 

---

# Table of Contents

* [Project Overview](#project-overview)
* [Problem Statement](#problem-statement)
* [Project Objectives](#project-objectives)
* [Key Features](#key-features)
* [System Architecture](#system-architecture)
* [End-to-End System Flow](#end-to-end-system-flow)
* [Core Modules](#core-modules)
* [Frontend Architecture](#frontend-architecture)
* [Backend Architecture](#backend-architecture)
* [Backend Responsibilities](#backend-responsibilities)
* [Backend Project Structure](#backend-project-structure)
* [Database Architecture](#database-architecture)
* [Database Schema](#database-schema)
* [Authentication & Authorization](#authentication--authorization)
* [API Architecture](#api-architecture)
* [API Endpoints](#api-endpoints)
* [Machine Learning Architecture](#machine-learning-architecture)
* [Dataset](#dataset)
* [Data Preprocessing](#data-preprocessing)
* [Feature Engineering](#feature-engineering)
* [Target Variable](#target-variable)
* [Why Regression](#why-regression)
* [Chronological Data Split](#chronological-data-split)
* [ML Preprocessing Pipeline](#ml-preprocessing-pipeline)
* [Model Development](#model-development)
* [Model Comparison](#model-comparison)
* [Final XGBoost Model](#final-xgboost-model)
* [Model Evaluation](#model-evaluation)
* [Overfitting Analysis](#overfitting-analysis)
* [LSTM Experiments](#lstm-experiments)
* [Lag and Rolling Feature Experiment](#lag-and-rolling-feature-experiment)
* [Demand Forecasting](#demand-forecasting)
* [Pricing Intelligence](#pricing-intelligence)
* [Revenue Optimization](#revenue-optimization)
* [Competitor Analysis](#competitor-analysis)
* [Dashboard Architecture](#dashboard-architecture)
* [ML + Backend Integration](#ml--backend-integration)
* [Model Serialization](#model-serialization)
* [MLOps](#mlops)
* [Testing](#testing)
* [Monitoring](#monitoring)
* [Responsible Pricing](#responsible-pricing)
* [Business KPIs](#business-kpis)
* [Technology Stack](#technology-stack)
* [Project Structure](#project-structure)
* [Development Roadmap](#development-roadmap)
* [Current Project Status](#current-project-status)
* [Future Enhancements](#future-enhancements)
* [Installation](#installation)
* [Team](#team)

---

# Project Overview

Modern businesses operate in environments where prices, demand, inventory, and competition can change continuously.

Traditional static pricing can result in:

* Overpricing
* Demand loss
* Underpricing
* Margin loss
* Poor competitor response
* Inefficient promotions
* Inventory imbalance
* Manual decision-making
* Missed revenue opportunities

PricePilot AI addresses these challenges by creating a centralized pricing intelligence platform.

The platform follows the pipeline:

```text
Business Data
      ↓
Data Processing
      ↓
Machine Learning
      ↓
Demand Prediction
      ↓
Pricing Intelligence
      ↓
Revenue Simulation
      ↓
Profit Analysis
      ↓
Pricing Recommendation
      ↓
Business Dashboard
```

The project specification identifies seven major functional modules:

1. User Management
2. Product & Pricing Data
3. Price Prediction
4. Demand Forecasting
5. Competitor Analysis
6. Revenue Optimization
7. Pricing Analytics Dashboard 

---

# Problem Statement

Businesses need to continuously evaluate pricing decisions based on:

* Demand
* Product performance
* Competitor prices
* Inventory
* Discounts
* Promotions
* Seasonality
* Historical sales

Static pricing strategies do not provide sufficient intelligence for these changing conditions.

PricePilot AI transforms historical and operational data into:

```text
Predicted Demand
       ↓
Pricing Intelligence
       ↓
Revenue / Profit Simulation
       ↓
Pricing Recommendation
```

The system is intended to provide quantitative support for business pricing decisions rather than relying entirely on manual judgment. 

---

# Project Objectives

PricePilot AI aims to:

* Predict product demand
* Forecast future demand
* Analyze demand trends
* Compare prices with competitors
* Detect pricing opportunities
* Simulate candidate prices
* Estimate expected revenue
* Estimate expected profit
* Analyze margins
* Generate pricing recommendations
* Provide business intelligence dashboards
* Support multi-user organizations
* Provide secure authentication
* Integrate ML models with backend APIs
* Support containerized and cloud deployment

The specification also identifies applications in:

* E-commerce
* Retail
* Marketplaces
* Airlines
* Hotels
* Subscription platforms
* Sales and revenue teams 

---

# Key Features

| Feature                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| User Management         | Registration, authentication, authorization and roles |
| Organization Management | Multi-tenant organization support                     |
| Product Management      | Product catalog and product information               |
| Category Management     | Product categorization                                |
| Inventory Management    | Inventory tracking                                    |
| Competitor Management   | Competitor information and mapping                    |
| Competitor Pricing      | Competitor price tracking                             |
| Demand Prediction       | ML-based demand prediction                            |
| Demand Forecasting      | Future demand estimation                              |
| Pricing Intelligence    | Candidate price evaluation                            |
| Revenue Optimization    | Revenue and profit simulation                         |
| Pricing Recommendations | Data-driven pricing recommendations                   |
| Sales Analytics         | Sales and revenue analysis                            |
| AI Integration          | Gemini, Grok and custom ML endpoints                  |
| Pricing History         | Historical pricing records                            |
| Dashboard               | Business intelligence and analytics                   |

---

# System Architecture

```text
                         BUSINESS USERS
                               │
                               ▼
                    ┌─────────────────────┐
                    │     FRONTEND        │
                    │ React / Next.js     │
                    │ Dashboard           │
                    │ Analytics           │
                    │ Reports             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FASTAPI BACKEND  │
                    │                     │
                    │ API Routes          │
                    │ Validation           │
                    │ Authentication       │
                    │ Authorization        │
                    │ Business Services    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ Product    │   │ Pricing    │   │ Competitor │
       │ Services   │   │ Services   │   │ Services   │
       └────────────┘   └─────┬──────┘   └────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   ML INFERENCE      │
                    │                     │
                    │ Feature Generation  │
                    │ Preprocessor        │
                    │ XGBoost Model       │
                    │ Demand Prediction   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ PRICING INTELLIGENCE│
                    │                     │
                    │ Candidate Prices    │
                    │ Demand Prediction   │
                    │ Revenue Simulation  │
                    │ Profit Simulation   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    POSTGRESQL       │
                    │                     │
                    │ Users               │
                    │ Products            │
                    │ Inventory           │
                    │ Pricing             │
                    │ Competitors         │
                    │ Sales               │
                    │ Recommendations     │
                    └─────────────────────┘
```

The project architecture connects the data layer, ML intelligence, FastAPI application layer, pricing/revenue engines, and React/Next.js business intelligence interface. 

---

# End-to-End System Flow

```text
                         USER
                           │
                           ▼
                  React / Next.js
                           │
                           ▼
                    FastAPI API
                           │
                           ▼
               Authentication / JWT
                           │
                           ▼
                 Request Validation
                           │
                           ▼
                 Product Context
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        PostgreSQL                  ML Pipeline
              │                         │
              │                         ▼
              │                   Feature Generation
              │                         │
              │                         ▼
              │                    Preprocessing
              │                         │
              │                         ▼
              │                    XGBoost Model
              │                         │
              │                         ▼
              │                  Predicted Demand
              │                         │
              └────────────┬────────────┘
                           ▼
                  Pricing Intelligence
                           │
                           ▼
                  Revenue Simulation
                           │
                           ▼
                   Profit Simulation
                           │
                           ▼
                Pricing Recommendation
                           │
                           ▼
                     API Response
                           │
                           ▼
                      Dashboard
```

---

# Core Modules

## 1. User Management

Responsibilities:

* User registration
* Login
* Authentication
* Authorization
* Role management
* Organization membership
* Access control

---

## 2. Product & Pricing Data

Responsibilities:

* Product catalog
* Product categories
* Product variants
* Inventory
* Sales records
* Historical pricing
* Data validation

---

## 3. Price Prediction / Pricing Intelligence

Responsibilities:

* Demand-aware pricing analysis
* Candidate price evaluation
* Pricing recommendations
* Price history
* Pricing performance

---

## 4. Demand Forecasting

Responsibilities:

* Demand prediction
* Future demand forecasting
* Seasonal analysis
* Demand trend classification
* Forecast visualization

The specification defines:

```text
Short Term
7 / 14 / 30 days

Medium Term
3 / 6 months

Long Term
12 months
```

with use cases ranging from inventory planning to strategic planning. 

---

## 5. Competitor Analysis

Responsibilities:

* Competitor management
* Competitor product matching
* Competitor price tracking
* Market comparison
* Competitive positioning
* Pricing opportunity detection

---

## 6. Revenue Optimization

Responsibilities:

* Revenue simulation
* Profitability analysis
* Margin analysis
* Pricing strategy recommendations
* Candidate price comparison

---

## 7. Pricing Analytics Dashboard

Responsibilities:

* Revenue analytics
* Pricing performance
* Product profitability
* Demand analytics
* Competitor analytics
* Forecast visualization
* Business intelligence reports

---

# Frontend Architecture

The frontend is designed using:

```text
React.js / Next.js
Tailwind CSS
Chart.js / Recharts
```

The dashboard layer is responsible for presenting:

### Executive Overview

* Total Revenue
* Revenue Growth
* Average Price
* Predicted Demand
* Inventory Health
* Competitive Price Index

### Product Analytics

* Product Revenue
* Units Sold
* Predicted Demand
* Current Price
* Competitor Price
* Discount
* Margin

### Forecast Dashboard

* Historical Demand
* Forecast Demand
* Demand Trend
* Confidence
* Forecast Horizon

### Pricing Dashboard

* Current Price
* Recommended Price
* Expected Demand
* Expected Revenue
* Expected Profit
* Competitor Position

These dashboard requirements are defined in the full technical documentation. 

---

# Backend Architecture

PricePilot AI uses **Python + FastAPI** as its application backend.

The backend acts as the central communication layer between:

```text
Frontend
   ↕
FastAPI
   ↕
Services
   ↕
Database / ML
```

The implemented backend covers application functionality including authentication, users, organizations, products, categories, inventory, competitors, pricing, sales and AI services. 

---

# Backend Responsibilities

The FastAPI backend handles:

### Authentication

* Registration
* Login
* Token generation
* Current-user information
* Access control

### Organization

* Organization creation
* Organization lookup
* Organization members

### Products

* Product creation
* Product retrieval
* Product updates
* Product deletion
* Product variants
* Inventory

### Competitors

* Competitor management
* Competitor product matching
* Competitor price records
* Competitor price history

### Pricing

* Pricing prediction
* Pricing recommendations
* Applying recommendations
* Pricing history

### Sales

* Sales records
* Sales analytics

### AI

* Gemini
* Grok
* Custom ML prediction

---

# Backend Project Structure

```text
backend/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── organizations.py
│   │   │   ├── categories.py
│   │   │   ├── products.py
│   │   │   ├── competitors.py
│   │   │   ├── pricing.py
│   │   │   └── sales.py
│   │   │
│   │   └── dependencies/
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
│   ├── services/
│   │   ├── pricing_service.py
│   │   ├── forecast_service.py
│   │   ├── competitor_service.py
│   │   └── revenue_service.py
│   │
│   ├── ml/
│   │   ├── preprocessing/
│   │   ├── models/
│   │   ├── inference/
│   │   └── evaluation/
│   │
│   └── repositories/
│
├── alembic/
│
├── tests/
│
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

This layered organization separates API routes, dependencies, configuration/security, models, schemas, services, ML components and repositories. 

---

# Database Architecture

PricePilot AI uses **PostgreSQL** as its primary relational database.

The database follows a:

* Normalized relational design
* Multi-tenant architecture
* Organization-centric structure
* Foreign-key based relationship model
* Separation of business entities

The Milestone 2 documentation specifically describes the PostgreSQL database as normalized and multi-tenant. 

---

# Database Schema

## Authentication & Organization

```text
organizations
users
roles
user_roles
organization_members
refresh_tokens
```

## Product Management

```text
categories
products
product_variants
inventory
```

## Competitor Intelligence

```text
competitors
competitor_products
competitor_prices
```

## Pricing Intelligence

```text
price_histories
pricing_recommendations
```

## Sales

```text
sales_records
```

These entities form the main relational data foundation of the application. 

---

# Database Relationship

```text
                         ORGANIZATION
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
          ▼                   ▼                  ▼
        USERS             CATEGORIES         COMPETITORS
          │                   │                  │
          │                   ▼                  ▼
          │                PRODUCTS       COMPETITOR_PRODUCTS
          │                   │                  │
          │          ┌────────┼────────┐         ▼
          │          │        │        │  COMPETITOR_PRICES
          │          ▼        ▼        ▼
          │      VARIANTS  INVENTORY  PRICE_HISTORY
          │                   │
          │                   ▼
          │              SALES_RECORDS
          │
          ▼
     ORGANIZATION_MEMBERS
          │
          ▼
       ROLES / USER_ROLES
```

The database relationship design connects organizations with users, products, categories, inventory, sales, pricing history, competitor information and pricing recommendations. 

---

# Authentication & Authorization

The backend uses a security architecture based on:

```text
Password Hashing
       ↓
JWT Authentication
       ↓
Access Token
       ↓
Refresh Token
       ↓
Token Expiration
       ↓
Role Authorization
       ↓
Organization Authorization
```

Security requirements include:

* Password hashing
* JWT access tokens
* Refresh tokens
* Token expiration
* Role-based authorization
* Organization-level authorization
* Audit logging

Plaintext passwords and secrets should never be stored in the database. 

---

# API Architecture

The backend follows:

```text
HTTP Request
     ↓
FastAPI Route
     ↓
Request Schema
     ↓
Authentication / Dependency
     ↓
Service Layer
     ↓
Repository / ML Service
     ↓
PostgreSQL / Model
     ↓
Response Schema
     ↓
JSON Response
```

---

# API Endpoints

The current API endpoint reference contains **38 endpoints** covering authentication, users, organizations, categories, products, competitors, pricing, sales, AI and system health.  

## Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/token
GET  /api/v1/auth/me
```

## Users

```http
GET /api/v1/users/
GET /api/v1/users/{user_id}
PUT /api/v1/users/{user_id}
```

## Organizations

```http
GET  /api/v1/organizations/
POST /api/v1/organizations/
GET  /api/v1/organizations/{org_id}
POST /api/v1/organizations/{org_id}/members
```

## Categories

```http
POST /api/v1/categories/
GET  /api/v1/categories/organization/{org_id}
```

## Products

```http
POST   /api/v1/products/
GET    /api/v1/products/organization/{org_id}
GET    /api/v1/products/{product_id}
PUT    /api/v1/products/{product_id}
DELETE /api/v1/products/{product_id}
POST   /api/v1/products/{product_id}/variants
GET    /api/v1/products/{product_id}/inventory
PUT    /api/v1/products/{product_id}/inventory
```

## Competitors

```http
POST /api/v1/competitors/
GET  /api/v1/competitors/organization/{org_id}
PUT  /api/v1/competitors/{competitor_id}

POST /api/v1/competitors/match
POST /api/v1/competitors/prices

GET /api/v1/competitors/product/{product_id}/prices
```

## Pricing

```http
POST /api/v1/pricing/predict

POST /api/v1/pricing/recommendations

POST /api/v1/pricing/recommendations/{recommendation_id}/apply

GET /api/v1/pricing/history/{product_id}
```

## Sales

```http
POST /api/v1/sales/

GET /api/v1/sales/analytics/{organization_id}
```

## AI

```http
POST /api/v2/ai/gemini
POST /api/v2/ai/grok
POST /api/v2/ai/predict
```

## System

```http
GET /
GET /health
```

The endpoint reference documents the API grouping and purpose for the authentication, user, organization, category, product, competitor, pricing, sales, AI and system routes. 

---

# Machine Learning Architecture

The ML layer converts historical business data into demand predictions.

```text
Historical Data
      ↓
Data Cleaning
      ↓
EDA
      ↓
Feature Engineering
      ↓
Temporal Split
      ↓
Preprocessing
      ↓
Model Training
      ↓
Model Evaluation
      ↓
Model Selection
      ↓
Model Serialization
      ↓
FastAPI Inference
```

The Milestone 2 workflow was specifically designed to keep the ML pipeline separate from the backend so the trained model and preprocessing pipeline could later be integrated into FastAPI. 

---

# Dataset

The primary ML dataset contains:

```text
Records          : 76,000
Unique Dates     : 760
Stores           : 5
Products         : 20
Store-Product    : 100 combinations
Date Range       : 2022-01-01 → 2024-01-30
```

The dataset represents historical retail/e-commerce business observations. 

---

# Data Preprocessing

The preprocessing workflow included:

* Dataset inspection
* Missing-value checking
* Duplicate checking
* Data-type validation
* Date conversion
* Outlier analysis
* Outlier treatment
* Feature engineering

The cleaned dataset was saved as:

```text
sales_cleaned.csv
```

IQR-based outlier treatment was applied to selected variables including:

```text
Discount
Units Ordered
Inventory Level
```



---

# Feature Engineering

## Revenue

```text
Revenue =
Units Sold × Price × (1 - Discount / 100)
```

---

## Price Difference

```text
Price Difference =
Price - Competitor Pricing
```

Interpretation:

```text
Positive → Our price is higher
Negative → Our price is lower
Zero     → Prices are approximately equal
```

---

## Relative Price Difference

```text
Relative Price Difference =
(Price - Competitor Pricing) / Competitor Pricing
```

---

## Price Position

A categorical feature represents whether the company's product is:

```text
Cheaper
Similar
More Expensive
```

This is particularly useful for competitor intelligence. 

---

# Temporal Features

The model uses:

```text
Year
Month
Day
Day of Week
Quarter
Week of Year
```

Cyclical encoding is also used.

### Month

```text
Month Sin = sin(2π × Month / 12)

Month Cos = cos(2π × Month / 12)
```

### Day of Week

```text
DayOfWeek Sin = sin(2π × DayOfWeek / 7)

DayOfWeek Cos = cos(2π × DayOfWeek / 7)
```

Cyclical encoding prevents calendar boundaries from appearing artificially far apart. 

---

# Final ML Feature Set

The final XGBoost model uses **26 features**:

```text
1.  Store ID
2.  Product ID
3.  Category
4.  Region
5.  Inventory Level
6.  Units Ordered
7.  Price
8.  Discount
9.  Weather Condition
10. Promotion
11. Competitor Pricing
12. Seasonality
13. Epidemic
14. Year
15. Month
16. Day
17. Price Difference
18. Relative Price Difference
19. Price Position
20. Day of Week
21. Quarter
22. Week of Year
23. Month Sin
24. Month Cos
25. DayOfWeek Sin
26. DayOfWeek Cos
```

Excluded variables include:

```text
Date
Demand
Units Sold
Revenue
Inventory Group
Relative Price Difference %
```

Units Sold and Revenue were excluded because using same-row outcomes could introduce target leakage in future demand prediction. 

---

# Target Variable

The primary ML target is:

```text
Demand
```

Demand prediction was selected because expected demand forms the foundation for the subsequent pricing intelligence workflow. 

---

# Why Regression?

Demand is a continuous numerical quantity.

For example:

```text
Predicted Demand = 128.6 units
```

Therefore, the primary ML problem is formulated as:

```text
Regression
```

rather than classification.

The model estimates:

```text
Demand = f(
    Product,
    Store,
    Price,
    Discount,
    Promotion,
    Inventory,
    Competitor Price,
    Seasonality,
    ...
)
```

The final model is therefore an:

```text
XGBoost Regressor
```

---

# Chronological Data Split

Random splitting was avoided because the data contains a temporal dimension.

The dataset was split chronologically:

```text
760 Unique Dates

        70%
         │
         ▼
     TRAINING
2022-01-01
     ↓
2023-06-16

        15%
         │
         ▼
   VALIDATION
2023-06-17
     ↓
2023-10-08

        15%
         │
         ▼
      TEST
2023-10-09
     ↓
2024-01-30
```

Actual row counts:

```text
Training    : 53,200
Validation  : 11,400
Testing     : 11,400
```

This preserves the temporal relationship:

```text
Past → Training → Later → Validation → Future → Test
```



---

# ML Preprocessing Pipeline

A `ColumnTransformer` was used.

## Numerical Features

```text
StandardScaler
```

## Categorical Features

```text
OneHotEncoder(
    handle_unknown="ignore"
)
```

The preprocessing pipeline was fitted only on the training data and subsequently applied to validation and test data. This prevents validation/test information from influencing preprocessing parameters. 

---

# Model Development

Multiple approaches were evaluated:

```text
Linear Regression
       ↓
Ridge Regression
       ↓
Lasso Regression
       ↓
Decision Tree
       ↓
Random Forest
       ↓
XGBoost
       ↓
LSTM Benchmark
```

The project specification also identifies Prophet and ARIMA as candidate time-series models. 

---

# Model Comparison

| Model                   |       MAE |      RMSE |         R² |       MAPE |
| ----------------------- | --------: | --------: | ---------: | ---------: |
| Linear Regression       |     25.59 |     33.39 |     0.5201 |     31.48% |
| Ridge Regression        |     25.22 |     32.91 |     0.5337 |     30.73% |
| Lasso Regression        |     25.22 |     32.91 |     0.5337 |     30.73% |
| Decision Tree           |     21.87 |     32.87 |     0.5350 |     23.92% |
| Optimized Decision Tree |     21.46 |     29.91 |     0.6149 |     25.69% |
| Random Forest           |     20.32 |     27.83 |     0.6666 |     25.18% |
| Original XGBoost        |     16.23 |     22.69 |     0.7784 |     20.27% |
| Tuned XGBoost           |     14.01 |     19.96 |     0.8285 |     17.45% |
| **Final XGBoost Test**  | **12.43** | **17.24** | **0.8527** | **18.94%** |

Development-stage metrics are primarily validation results, whereas the final selected model's headline result is from the held-out test set, so the table should not be interpreted as a perfectly apples-to-apples ranking. 

---

# Final XGBoost Model

The selected model is:

```python
from xgboost import XGBRegressor

final_xgb_model = XGBRegressor(
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

Final configuration:

```text
n_estimators       = 500
learning_rate      = 0.05
max_depth          = 6
subsample          = 0.8
colsample_bytree   = 0.8
```



---

# Why XGBoost?

The dataset is structured/tabular and contains nonlinear relationships.

XGBoost can learn relationships involving:

* Product effects
* Store effects
* Category effects
* Price
* Competitor pricing
* Promotion
* Inventory
* Seasonality
* Feature interactions

This allowed XGBoost to outperform the tested linear and sequence-based approaches in the current experiment. 

---

# Model Evaluation

## Training

```text
MAE  = 11.61
RMSE = 16.15
R²   = 0.8809
MAPE = 16.19%
```

## Validation

```text
MAE  = 14.01
RMSE = 19.96
R²   = 0.8285
MAPE = 17.45%
```

## Test

```text
MAE  = 12.43
RMSE = 17.24
R²   = 0.8527
MAPE = 18.94%
```

The principal held-out result is:

> **R² = 0.8527 on the test dataset.**

This means the model explains approximately **85.27% of the variance in the target under this evaluation setup**. It should not be described as "85.27% prediction accuracy." 

---

# Evaluation Metrics

## MAE

```text
MAE = mean(|Actual - Predicted|)
```

Measures average absolute prediction error.

---

## MSE

```text
MSE = mean((Actual - Predicted)²)
```

Penalizes larger errors more heavily.

---

## RMSE

```text
RMSE = √MSE
```

Expresses error in the same unit as the target.

---

## R²

```text
R² = 1 - SSres / SStot
```

Measures the proportion of target variance explained by the model.

---

## MAPE

```text
MAPE =
mean(|(Actual - Predicted) / Actual|) × 100
```

MAPE should be interpreted carefully when actual demand approaches zero. 

---

# Overfitting Analysis

Final XGBoost:

```text
Training R²   = 0.8809
Validation R² = 0.8285
Test R²       = 0.8527
```

Training-validation gap:

```text
0.8809 - 0.8285
= 0.0524
```

Training-test gap:

```text
0.8809 - 0.8527
= 0.0282
```

Under this experiment, these gaps do not indicate severe overfitting. 

---

# LSTM Experiments

LSTM was evaluated as a deep-learning benchmark.

## Initial LSTM

```text
Train R²       = 0.3246
Validation R²  = 0.2328
Test R²        = 0.2969
```

## Improved LSTM

The improved architecture included:

* Full engineered features
* One-hot categorical features
* Store embeddings
* Product embeddings
* Bidirectional LSTM
* Layer normalization
* Dropout
* Dense layers
* Huber loss
* Adam optimizer
* ReduceLROnPlateau
* Early stopping

Sequence size:

```text
30 × 39
```

Trainable parameters:

```text
98,185
```

Test performance:

```text
MAE  = 29.95
RMSE = 38.36
R²   = 0.2705
MAPE = 47.25%
```

The tested LSTM architectures did not outperform XGBoost on the current dataset representation. 

---

# Lag and Rolling Feature Experiment

Historical demand features were tested:

```text
Demand Lag 1
Demand Lag 7
Demand Lag 14
Demand Lag 30

Rolling Mean 7
Rolling Mean 14
Rolling Mean 30
```

Shifted values were used to avoid directly exposing the current target.

Validation:

```text
MAE  = 16.68
RMSE = 22.93
R²   = 0.7761
MAPE = 21.40%
```

This did not improve the selected XGBoost configuration and therefore was not adopted as the final feature set. 

---

# Demand Forecasting

The intended forecasting pipeline is:

```text
Historical Business Data
        ↓
Data Validation
        ↓
Data Cleaning
        ↓
Feature Engineering
        ↓
Chronological Split
        ↓
Preprocessing
        ↓
Demand Model
        ↓
Future Feature Generation
        ↓
Demand Prediction
        ↓
┌─────────────────┐
│                 │
▼                 ▼
Trend          Confidence
│                 │
└────────┬────────┘
         ▼
   Forecast API
         ↓
     Dashboard
```



---

# Forecast Horizons

## Short-Term

```text
7 Days
14 Days
30 Days
```

Use cases:

* Inventory planning
* Daily pricing
* Promotion planning

## Medium-Term

```text
3 Months
6 Months
```

Use cases:

* Procurement
* Revenue forecasting
* Capacity planning

## Long-Term

```text
12 Months
```

Use cases:

* Strategic planning
* Product expansion
* Annual forecasting

The current XGBoost model should not automatically be described as a validated 12-month forecasting model without dedicated long-horizon backtesting. 

---

# Demand Trend Classification

The intended system provides:

```text
Increasing Demand
Stable Demand
Decreasing Demand
```

Conceptually:

```text
Forecast Slope > Upper Threshold
            ↓
       Increasing


Forecast Slope within Threshold
            ↓
          Stable


Forecast Slope < Lower Threshold
            ↓
       Decreasing
```

Thresholds should be calibrated using historical data. 

---

# Forecast Confidence

The project specification requires a:

```text
0% – 100%
```

confidence output.

However, confidence should **not** simply be calculated from R².

A production confidence mechanism may incorporate:

* Historical validation error
* Prediction interval width
* Forecast horizon
* Data quality
* Recent observations
* Distribution shift
* Model stability

Formal confidence reporting requires appropriate calibration. 

---

# Pricing Intelligence

The most important architectural distinction is:

```text
             XGBoost
                │
                ▼
        Predicted Demand
                │
                ▼
      Pricing Intelligence
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
Current Price  Competitor Inventory
     │          Price      │
     └──────────┼──────────┘
                ▼
        Candidate Prices
                │
                ▼
        Revenue Simulation
                │
                ▼
         Profit Simulation
                │
                ▼
       Business Constraints
                │
                ▼
       Pricing Recommendation
```

Therefore:

> **XGBoost predicts demand. The pricing engine uses that prediction to evaluate pricing scenarios.**

---

# Dynamic Pricing Workflow

```text
Current Product Context
        ↓
Generate Candidate Prices
        ↓
Generate Features
        ↓
Predict Demand
        ↓
Calculate Revenue
        ↓
Calculate Profit
        ↓
Apply Business Constraints
        ↓
Rank Candidates
        ↓
Pricing Recommendation
```



---

# Revenue Optimization

For price `P` and predicted demand `D`:

### Expected Revenue

```text
Expected Revenue = P × D
```

### Net Revenue with Discount

```text
Net Revenue =
P × D × (1 - Discount / 100)
```

### Expected Profit

If unit cost `C` is known:

```text
Expected Profit =
(P - C) × D
```

Possible optimization objectives include:

```text
Revenue Maximization
Profit Maximization
Margin Maximization
Inventory-Aware Optimization
```



---

# Pricing Simulation

Example candidate prices:

```text
₹900
₹950
₹1,000
₹1,050
₹1,100
₹1,150
```

For each candidate price:

```text
1. Generate model input
2. Predict demand
3. Calculate revenue
4. Calculate profit
5. Apply constraints
6. Rank candidate
```



---

# Competitor Analysis

The competitive pricing index is:

```text
Price Index =
Our Price / Competitor Price
```

Interpretation:

```text
< 1.0 → Our price is lower

= 1.0 → Approximately equal

> 1.0 → Our price is higher
```

This can be combined with:

* Demand
* Inventory
* Promotions
* Product performance

to identify pricing opportunities. 

---

# Pricing Opportunity Detection

## Undercut Opportunity

```text
Our price is significantly below competitors
+
Demand is strong
```

Potential scenario:

```text
Evaluate higher price
```

## Premium Position

```text
Our price > competitor
+
Demand remains strong
```

Potential scenario:

```text
Maintain or carefully test premium pricing
```

## Demand Weakness

```text
Demand is weak
+
Our price > competitor
```

Potential scenario:

```text
Evaluate price reduction / promotion
```

## Excess Inventory

```text
Inventory is high
+
Demand is weak
```

Potential scenario:

```text
Evaluate discounts / promotions
```

All recommendations should respect business constraints. 

---

# ML + Backend Integration

The production inference flow is:

```text
Frontend
   ↓
FastAPI Request
   ↓
Request Validation
   ↓
Product Context
   ↓
Feature Generation
   ↓
Preprocessor
   ↓
XGBoost Model
   ↓
Predicted Demand
   ↓
Pricing Intelligence
   ↓
Revenue / Profit Analysis
   ↓
Recommendation
   ↓
JSON Response
   ↓
Frontend Dashboard
```

The backend must use **the same feature definitions and preprocessing pipeline used during model training**. This is specifically identified as an important backend–ML integration requirement. 

---

# Model Serialization

The final model should be stored together with its preprocessing pipeline and feature metadata.

```python
model_package = {
    "model": final_xgb_model,
    "preprocessor": preprocessor,
    "features": features,
    "model_name": "XGBoost Demand Prediction",
    "version": "1.0"
}
```

Example artifact:

```text
saved_models/
│
├── pricepilot_xgboost_model.pkl
└── model_metadata.json
```

The saved artifact allows FastAPI to load the trained model without retraining it for every request.

---

# MLOps

The intended MLOps lifecycle is:

```text
Data Sources
      ↓
Data Ingestion
      ↓
Validation
      ↓
Feature Engineering
      ↓
Training
      ↓
Evaluation
      │
      ├── Failed → Review
      │
      ▼
Model Registry
      ↓
Deployment
      ↓
Inference API
      ↓
Monitoring
      ↓
Retraining
```



---

# Monitoring

## Application Monitoring

```text
Request Latency
Error Rate
Database Latency
Active Users
```

## ML Monitoring

```text
Prediction Latency
Prediction Distribution
Feature Drift
Model Version
Forecast Error
```

## Business Monitoring

```text
Recommendation Acceptance
Revenue Impact
Profit Impact
Price Changes
Demand Changes
```



---

# Testing

## Unit Testing

Test:

* Feature calculations
* Revenue calculations
* Price difference calculations
* Pricing formulas
* Authentication utilities
* Service methods

## API Testing

Test:

* Login
* Authorization
* Products
* Forecasts
* Pricing
* Revenue simulation

## ML Testing

Test:

* Feature ordering
* Preprocessor compatibility
* Model loading
* Prediction shape
* Unknown categories
* Missing inputs
* Output ranges

## Integration Testing

```text
Frontend
   ↓
API
   ↓
Database
   ↓
ML
   ↓
Response
```

The project documentation defines this full integration-testing path. 

---

# Responsible Pricing

The pricing engine should enforce:

```text
Minimum Margin
Maximum Daily Price Change
Minimum Price
Maximum Price
Promotional Constraints
Inventory Safety Rules
Contractual Restrictions
Human Approval for High-Impact Changes
```

The model should not autonomously change prices without appropriate business governance. 

---

# Causal Pricing Limitation

A crucial technical limitation is:

```text
Demand Prediction ≠ Causal Price Optimization
```

The ML model estimates:

```text
Demand = f(features)
```

Pricing optimization asks:

```text
"What happens if we change the price?"
```

That is partly a causal question.

Historical data can contain confounding factors such as:

* Promotions
* Product popularity
* Seasonality
* Inventory
* Competitor activity
* Store differences

Future improvements may include:

* Price elasticity modeling
* Causal inference
* Controlled experiments
* Uplift modeling
* Contextual bandits
* Reinforcement learning

Therefore, the current XGBoost model should be described as a **demand predictor**, not as proof of causal price elasticity. 

---

# Business KPIs

## Revenue

```text
Total Revenue
Revenue Growth
Revenue per Product
Revenue per Category
```

## Pricing

```text
Average Selling Price
Competitor Price Gap
Price Index
Recommended vs Actual Price
```

## Demand

```text
Units Sold
Predicted Demand
Forecast Error
Demand Trend
```

## Profitability

```text
Gross Profit
Margin
Profit per Product
Expected Profit
```

## Recommendation Effectiveness

```text
Acceptance Rate
Revenue Uplift
Margin Uplift
Demand Response
```



---

# Business Impact Measurement

Revenue improvement can be calculated as:

```text
Revenue Improvement % =
(New Revenue - Baseline Revenue)
/
Baseline Revenue
× 100
```

Profit improvement:

```text
Profit Improvement % =
(New Profit - Baseline Profit)
/
Baseline Profit
× 100
```

For rigorous measurement, controlled experiments or causal methods are preferable to simple before/after comparisons. 

---

# Explainability

A pricing recommendation should ideally explain:

```text
Current Price
Competitor Price
Predicted Demand
Inventory
Promotion
Expected Revenue
Expected Profit
Competitive Position
Model Drivers
```

SHAP can later be integrated to provide XGBoost feature-level explanations. 

Example:

```text
Recommended Price: ₹1,075

Factors:
+ Strong predicted demand
+ Competitor price: ₹1,100
+ Moderate inventory
+ Active promotion

Expected Impact:
Revenue: +X%
Profit: +Y%
```

The actual X/Y values must be calculated by the system rather than hard-coded. 

---

# Technology Stack

## Programming

```text
Python
JavaScript / TypeScript
```

## Frontend

```text
React.js
Next.js
Tailwind CSS
Chart.js
Recharts
```

## Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy
JWT Authentication
```

## Database

```text
PostgreSQL
```

The original project specification also identifies MongoDB as a possible database technology. The current implemented architecture uses PostgreSQL as the primary relational database. 

## Machine Learning

```text
Pandas
NumPy
Scikit-learn
XGBoost
Random Forest
TensorFlow
Keras
```

## Forecasting

```text
XGBoost Regressor
Random Forest Regressor
LSTM
Prophet
ARIMA
```

Prophet and ARIMA are currently benchmark candidates rather than completed superior models. 

## DevOps

```text
Docker
Docker Compose
AWS
Azure
```

## Development Tools

```text
VS Code
Google Colab
Git
GitHub
Postman
FastAPI Swagger
```

The project specification lists these major technologies and development tools. 

---

# Project Structure

A complete implementation can be organized as:

```text
PricePilot-AI/
│
├── frontend/
│   │
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── dashboard/
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── dependencies/
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   │
│   │   ├── services/
│   │   │   ├── pricing_service.py
│   │   │   ├── forecast_service.py
│   │   │   ├── competitor_service.py
│   │   │   └── revenue_service.py
│   │   │
│   │   ├── ml/
│   │   │   ├── preprocessing/
│   │   │   ├── models/
│   │   │   ├── inference/
│   │   │   └── evaluation/
│   │   │
│   │   └── repositories/
│   │
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── ML_MODEL/
│   │
│   ├── data/
│   ├── notebooks/
│   ├── preprocessing/
│   ├── models/
│   ├── evaluation/
│   └── saved_models/
│
├── docs/
│
└── README.md
```

---

# Development Roadmap

## Phase 1 — Project Initialization

```text
Architecture
Database Design
UI Planning
Frontend Setup
Backend Setup
Authentication
Dataset Integration
Product Management
```

## Phase 2 — Machine Learning

```text
EDA
Feature Engineering
Temporal Split
Preprocessing
Regression Models
Random Forest
XGBoost
XGBoost Tuning
LSTM Benchmark
Final Model
```

## Phase 3 — Demand Intelligence

```text
Demand Prediction
Forecast API
Forecast Dashboard
Trend Classification
Confidence Calibration
```

## Phase 4 — Pricing Intelligence

```text
Candidate Price Generation
Demand Prediction
Revenue Simulation
Profit Simulation
Business Constraints
Pricing Recommendation
```

## Phase 5 — Competitor Intelligence

```text
Competitor Monitoring
Competitor Product Matching
Price Comparison
Market Intelligence
Pricing Opportunities
```

## Phase 6 — Business Intelligence

```text
Executive Dashboard
Product Dashboard
Pricing Dashboard
Forecast Dashboard
Revenue Simulation
Recommendation Interface
```

## Phase 7 — Testing

```text
Unit Tests
API Tests
Integration Tests
ML Validation
Load Testing
```

## Phase 8 — Deployment

```text
Docker
Docker Compose
Production Configuration
Cloud Deployment
Logging
Monitoring
CI/CD
```

These phases correspond to the project's documented implementation and milestone plan. 

---

# Current Project Status

## Data Science

```text
Dataset Loading             ✓
Data Cleaning               ✓
EDA                         ✓
Feature Engineering         ✓
Temporal Split              ✓
Preprocessing               ✓
Baseline Models             ✓
Decision Tree               ✓
Random Forest               ✓
XGBoost                     ✓
XGBoost Tuning              ✓
Final Test Evaluation       ✓
LSTM Benchmark              ✓
Lag/Rolling Experiment      ✓
Model Comparison            ✓
```

## Current Best Model

```text
XGBoost Regressor

Test R² = 0.8527
```



---

## Backend

```text
FastAPI Backend              ✓
PostgreSQL                   ✓
Alembic Migrations           ✓
Authentication               ✓
Organization Management     ✓
Product Management           ✓
Inventory Management         ✓
Competitor Management        ✓
Pricing APIs                 ✓
Sales APIs                   ✓
AI APIs                      ✓
ML Integration               In Progress
```

The Milestone 2 documentation records the FastAPI backend, PostgreSQL foundation, authentication, organization management and the application domain APIs as the implemented backend foundation. 

---

## Forecasting

```text
Demand Model                 ✓
Short-Term Design            ✓
Medium-Term Design           ✓
Long-Term Design             ✓
Trend Classification         Designed
Confidence Calibration       Pending
Prophet Benchmark            Pending
ARIMA Benchmark              Pending
```

---

## Frontend

```text
Dashboard Architecture       Designed
Authentication UI            In Progress
Product Dashboard             In Progress
Forecast Dashboard            In Progress
Pricing Dashboard             In Progress
Competitor Dashboard          In Progress
Revenue Simulation UI         In Progress
Executive Dashboard           In Progress
```

---

## Deployment

```text
Docker                       Planned
Docker Compose               Planned
Production Configuration     Planned
Cloud Deployment             Planned
Monitoring                   Planned
CI/CD                        Planned
```

The full documentation explicitly identifies Docker/cloud deployment, monitoring and CI/CD as later implementation stages. 

---

# Important Technical Limitations

## 1. Demand Model vs Price Optimization

The current XGBoost model predicts demand.

It does not directly prove that a particular price will cause a particular demand change.

---

## 2. Future Feature Availability

Some future forecasting variables may not be known in advance:

```text
Future Competitor Price
Future Weather
Future Realized Demand
Future Realized Revenue
```

Such variables must either be:

* Forecast
* Scenario-generated
* Known from business plans
* Excluded

The project documentation explicitly identifies these forecasting-validity concerns. 

---

## 3. Long-Horizon Forecasting

The specification supports 12-month forecasting, but the current XGBoost evaluation does not constitute a validated 12-month forecasting experiment.

Dedicated long-horizon backtesting is required. 

---

## 4. Confidence Score

The intended system contains a 0–100% confidence score, but a formal confidence score requires calibration.

R² should not simply be converted into confidence. 

---

# Future Enhancements

Planned improvements include:

### Machine Learning

* Prophet benchmark
* ARIMA benchmark
* Advanced time-series models
* Price elasticity modeling
* SHAP explainability
* Confidence calibration
* Model drift detection
* Automated retraining

### Pricing

* Causal price elasticity
* Contextual bandits
* Reinforcement learning
* A/B pricing experiments
* Automated promotion optimization
* Inventory-aware pricing

### Platform

* Real-time competitor scraping
* Real-time market data
* Advanced alerting
* Advanced executive dashboards
* Cloud-native ML serving
* CI/CD
* Production monitoring

The project documentation identifies price elasticity, causal inference, controlled experiments, uplift modeling, contextual bandits and reinforcement learning as potential future directions. 

---

# Installation

## Clone Repository

```bash
git clone <repository-url>

cd PricePilot-AI
```

---

# Backend Setup

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

# PostgreSQL Setup

Create the database:

```text
pricepilot_db
```

Configure the database connection through environment variables.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pricepilot_db
```

---

# Run Alembic Migrations

```bash
alembic upgrade head
```

---

# Start FastAPI

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

---

# ML Model

The final model artifact:

```text
saved_models/pricepilot_xgboost_model.pkl
```

contains:

```text
XGBoost Model
Preprocessor
Feature List
Model Metadata
```

The backend loads this artifact during inference.

---

# Example ML Inference

```text
Product
Price
Discount
Promotion
Inventory
Competitor Price
Seasonality
Store
Category
Region
        │
        ▼
Feature Generation
        │
        ▼
Preprocessing
        │
        ▼
XGBoost
        │
        ▼
Predicted Demand
```

Example:

```json
{
  "product_id": "P001",
  "predicted_demand": 128.6
}
```

---

# Example Pricing Intelligence

```text
Current Price       = ₹500
Competitor Price    = ₹520
Inventory           = 250
Discount            = 10%

Candidate Prices:

₹480
₹500
₹520
₹540
₹560

        ↓

XGBoost Demand Prediction

        ↓

Revenue Calculation

        ↓

Profit Calculation

        ↓

Business Constraints

        ↓

Pricing Recommendation
```

The actual recommended price must be generated from the implemented optimization logic rather than hard-coded.

---

# Complete PricePilot AI Architecture

```text
                         ┌───────────────────┐
                         │   BUSINESS USER   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ React / Next.js   │
                         │ Dashboard         │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     FastAPI       │
                         │   REST Backend    │
                         └─────────┬─────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
      Authentication         Product Services      Competitor
      & Authorization                              Services
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     PostgreSQL    │
                         │   Data Platform   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Feature Engine   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    Preprocessor   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ XGBoost Regressor │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ Predicted Demand  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   PRICING INTELLIGENCE    │
                     └─────────────┬─────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  ▼                ▼                ▼
             Competitor       Revenue            Profit
              Analysis       Simulation         Simulation
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                                   ▼
                       Business Constraints
                                   │
                                   ▼
                         Pricing Recommendation
                                   │
                                   ▼
                              Dashboard
                                   │
                                   ▼
                         Business Decision
```

---

# Project Vision

PricePilot AI is designed to evolve from a machine-learning demand prediction system into a complete **dynamic pricing and revenue intelligence platform**.

The intended final pipeline is:

```text
                    BUSINESS DATA
                         │
                         ▼
                   DATA PIPELINE
                         │
                         ▼
                  MACHINE LEARNING
                         │
                         ▼
                 DEMAND PREDICTION
                         │
                         ▼
              DEMAND FORECASTING
                         │
                         ▼
             COMPETITOR INTELLIGENCE
                         │
                         ▼
                 PRICE SIMULATION
                         │
                         ▼
              REVENUE OPTIMIZATION
                         │
                         ▼
              PROFIT OPTIMIZATION
                         │
                         ▼
              PRICING RECOMMENDATION
                         │
                         ▼
                    DASHBOARD
                         │
                         ▼
                BUSINESS DECISION
                         │
                         ▼
                 DECISION LOGGING
                         │
                         ▼
                    MONITORING
```

This is also the final architecture direction identified in the project documentation. 

---

# Team

**Aditya Raj Pandey**

B.Tech — Computer Science & Engineering
Specialization — Artificial Intelligence & Machine Learning

---

# Project Status Summary

```text
┌──────────────────────────────────────────────┐
│              PRICEPILOT AI                   │
├──────────────────────────────────────────────┤
│ Dataset / EDA                    COMPLETED   │
│ Feature Engineering              COMPLETED   │
│ ML Experiments                   COMPLETED   │
│ XGBoost Tuning                   COMPLETED   │
│ Final XGBoost                    COMPLETED   │
│ Model Serialization              COMPLETED   │
│ PostgreSQL                       COMPLETED   │
│ FastAPI Backend                  COMPLETED   │
│ Authentication                   COMPLETED   │
│ Product / Inventory APIs         COMPLETED   │
│ Competitor APIs                  COMPLETED   │
│ Pricing APIs                     COMPLETED   │
│ Sales APIs                       COMPLETED   │
│ AI APIs                          COMPLETED   │
│ ML Inference Integration         IN PROGRESS │
│ Forecast API                     IN PROGRESS │
│ Pricing Optimization             IN PROGRESS │
│ Dashboard Integration            IN PROGRESS │
│ Testing                          IN PROGRESS │
│ Docker                           PLANNED     │
│ Cloud Deployment                 PLANNED     │
│ MLOps Monitoring                 PLANNED     │
└──────────────────────────────────────────────┘
```

The project's documented data-science work is substantially complete through final XGBoost evaluation, while production integration, confidence calibration, broader forecasting benchmarks, monitoring and deployment remain subsequent development stages. 

---

## Final Technical Summary

**PricePilot AI currently consists of three major technical layers:**

```text
┌─────────────────────────────────────────┐
│              APPLICATION                │
│                                         │
│ React / Next.js                         │
│ FastAPI                                 │
│ Authentication                          │
│ Product / Pricing / Competitor APIs     │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│              DATA LAYER                 │
│                                         │
│ PostgreSQL                              │
│ Organizations                           │
│ Users                                    │
│ Products                                 │
│ Inventory                                │
│ Competitors                              │
│ Pricing                                  │
│ Sales                                    │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           INTELLIGENCE LAYER            │
│                                         │
│ Feature Engineering                     │
│ Preprocessing                           │
│ XGBoost Regressor                       │
│ Demand Prediction                       │
│ Pricing Simulation                      │
│ Revenue Optimization                    │
│ Competitor Intelligence                 │
└─────────────────────────────────────────┘
```

The current **best ML result is XGBoost with a held-out test R² of 0.8527**, and the next engineering objective is to connect that model reliably to the FastAPI inference and pricing-intelligence workflow. 
