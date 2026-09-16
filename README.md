# PricePilot AI

## Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an AI-powered platform designed to help businesses make better pricing and demand decisions using machine learning, demand forecasting, competitor analysis and business analytics.

## Project Objectives

- Predict product demand using machine learning.
- Generate suitable price recommendations.
- Optimize prices based on expected profit.
- Forecast future product demand.
- Analyze competitor pricing.
- Calculate important business KPIs.
- Generate AI-based business insights.
- Display pricing, demand and revenue insights through a dashboard.

## Technologies Used

### Machine Learning
- Python
- Pandas
- NumPy
- Scikit-learn
- XGBoost

### Backend
- FastAPI
- Uvicorn

### Frontend
- React
- Vite
- Recharts
- Axios

### LLM
- Google Gemini
- google-genai

### Tools
- Jupyter Notebook
- VS Code
- Git
- GitHub
- FastAPI Swagger UI

## Datasets

### Demand Prediction Dataset

A dataset containing 35,000 records and 13 features was used for the initial demand prediction model.

### M5 Forecasting Dataset

The M5 Forecasting dataset was used for weekly demand forecasting. Sales, pricing and calendar information were prepared and used to train the forecasting model.

### UCI Online Retail Dataset

The UCI Online Retail dataset was used for business performance and KPI analysis.

## Main Features

### 1. Demand Prediction

Predicts product demand using historical sales, pricing, marketing and seasonal features.

### 2. Price Optimization

Tests different candidate prices and calculates predicted demand, expected revenue and expected profit to generate a price recommendation.

### 3. Demand Forecasting

Generates weekly demand forecasts and trend information using the M5 forecasting data.

### 4. Competitor Analysis

Analyzes competitor prices and provides information about the product's market position.

### 5. KPI Analysis

Calculates important business metrics such as:

- Total Revenue
- Total Orders
- Total Quantity Sold
- Average Order Value
- Top Products
- Top Customers
- Country-wise Revenue

### 6. Revenue Analysis

Provides monthly revenue trends and other revenue-related business metrics.

### 7. AI Business Insights

Google Gemini is integrated to generate simple business insights from pricing, demand, revenue and competitor results.

## Machine Learning Models

The following models were evaluated for demand prediction:

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor
- XGBoost Regressor

XGBoost was selected for the final demand prediction model after model comparison and hyperparameter tuning.

## Backend APIs

The FastAPI backend provides APIs for:

- Demand Prediction
- Price Optimization
- Weekly Demand Prediction
- Weekly Demand Forecasting
- Competitor Analysis
- Revenue and Profit Analysis
- Pricing Recommendation
- KPI Analysis
- LLM Business Insights

## Dashboard

The dashboard provides:

- Business KPI cards
- Price optimization results
- Demand forecasts
- Revenue trend visualization
- Competitor analysis
- AI business insights

## Project Structure

```text
Price-Pilot-AI/
│
├── backend/
│   ├── competitor_analysis.py
│   ├── main.py
│   └── revenue_optimization.py
│
├── data/
│   ├── m5/
│   │   └── demand_forecasting_data.csv
│   └── Online Retail.xlsx
│
├── eda/
│   ├── EDA_Demand_Forecasting.ipynb
│   └── Online_Retail_EDA.ipynb
│
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   └── ...
│
├── kpi/
│   ├── country_revenue.csv
│   ├── KPI_Analysis.ipynb
│   ├── monthly_sales_kpis.csv
│   ├── top_customers.csv
│   ├── top_product_quantity.csv
│   └── top_product_revenue.csv
│
├── llm/
│   └── llm_service.py
│
├── models/
│   ├── demand_model_features.pkl
│   ├── demand_prediction_model.json
│   ├── demand_prediction_model.pkl
│   ├── M5_Demand_Forecasting_Model.ipynb
│   ├── m5_weekly_demand_model.json
│   ├── m5_weekly_model_features.pkl
│   └── ML_Model_Training_and_Price_Optimization.ipynb
│
├── .env
├── .gitignore
└── README.md
