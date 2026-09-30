# PricePilot AI

## Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an AI-powered platform designed to help businesses make better pricing, demand, and revenue decisions using machine learning, demand forecasting, competitor analysis, product analytics, and business intelligence.

The platform provides an end-to-end workflow for analyzing business performance, predicting demand, optimizing product prices, comparing competitor prices, generating business recommendations, and creating downloadable business intelligence reports.

---

## Project Objectives

The main objectives of PricePilot AI are:

- Predict product demand using machine learning.
- Generate suitable price recommendations.
- Optimize pricing based on predicted demand and expected revenue.
- Forecast future product demand.
- Analyze competitor pricing.
- Identify product market position.
- Calculate important business KPIs.
- Analyze product-level sales performance.
- Generate automated business and pricing recommendations.
- Implement secure authentication and role-based authorization.
- Generate downloadable business intelligence reports.
- Provide an end-to-end pricing and revenue optimization workflow.

---

## Key Features

### 1. Role-Based Authentication and Authorization

PricePilot AI implements JWT-based authentication and role-based authorization.

The system supports three roles:

#### Admin

Admin users have access to:

- Dashboard
- Product Analytics
- Price Prediction
- Demand Forecasting
- Administrative functionality

#### Business Analyst

Business Analysts have access to:

- Dashboard
- Product Analytics
- Price Prediction
- Demand Forecasting
- Competitor Analysis
- AI Recommendations
- Business Intelligence Reports

#### User

Normal users have access to:

- Dashboard
- Product Analytics
- Basic business information

The Admin account is created separately through the backend as a privileged account and is not available as an option during normal user registration.

---

### 2. Business Dashboard

The Business Dashboard provides an overview of important business performance indicators.

#### Key Performance Indicators

- Total Revenue
- Total Sales
- Total Products
- Unique Orders

The dashboard provides a centralized view of important business metrics.

---

### 3. Product Analytics

The Product Analytics module provides detailed product-level performance analysis.

#### Product KPIs

- Product Price
- Units Sold
- Revenue
- Total Transactions
- Average Selling Price

#### Analytics Provided

- Sales trends
- Category performance
- Product performance
- Historical product analysis
- Product-level business metrics

The sales trend visualization displays the latest 12 months of product sales data.

---

### 4. Price Prediction and Revenue Optimization

The Price Prediction module uses an XGBoost regression model to analyze the relationship between product price and demand.

The system evaluates multiple candidate prices and predicts demand and expected revenue for each price.

The recommended price is selected based on the predicted revenue obtained from the tested price range.

#### Price Prediction Results

The module provides:

- Current Price
- Recommended Price
- Price Change Percentage
- Predicted Demand
- Expected Revenue
- Price Elasticity
- Reference Price
- Reference Demand
- Total Units Sold
- Total Revenue
- Total Transactions
- Average Selling Price
- Demand Level

#### Price Optimization Workflow

```text
Product Data
     |
     v
Current Product Price
     |
     v
Generate Candidate Prices
     |
     v
Predict Demand for Each Price
     |
     v
Calculate Expected Revenue
     |
     v
Compare Price Options
     |
     v
Recommended Price
````

---

### 5. Demand Forecasting

The Demand Forecasting module generates future weekly demand predictions.

Users can select:

* Product Category
* Product
* Forecast Period

The system generates weekly demand forecasts and displays the results using visualizations and a weekly breakdown.

#### Demand Forecasting Provides

* Weekly demand predictions
* Forecast visualization
* Weekly demand breakdown
* Forecast confidence information

The forecasting module supports demand planning and pricing-related business decisions.

---

### 6. Competitor Analysis

The Competitor Analysis module provides competitive pricing intelligence.

For a selected product, the system provides:

* Current Product Price
* Average Competitor Price
* Lowest Competitor Price
* Highest Competitor Price
* Market Position
* Price Difference
* Percentage Difference

The module also provides detailed competitor comparisons.

#### Competitor Comparison

The system compares the selected product with multiple competitors, including:

* Competitor A
* Competitor B
* Competitor C

A refresh functionality is also provided for competitor pricing information.

---

### 7. AI and Business Recommendations

The AI Recommendations module analyzes available business information and generates automated business and pricing recommendations.

The recommendation engine considers factors such as:

* Price
* Demand
* Sales
* Competition

#### Recommendation Areas

Recommendations can include:

* High-demand product opportunities
* Product performance observations
* Pricing and demand recommendations
* Competitor pricing observations
* Average order value insights
* Business performance insights

Each recommendation is assigned a priority level:

* High
* Medium
* Low

---

### 8. Business Intelligence Reports

The Business Intelligence Reports module provides a consolidated view of important business information.

#### Business Overview

The report contains:

* Total Revenue
* Total Sales
* Total Products
* Unique Orders

#### Product Performance

The report includes:

* Top Products by Quantity
* Top Products by Revenue

#### Business Insights

The system generates business insights based on the available business analytics.

#### Report Summary

A consolidated summary of the analyzed business information is provided.

#### PDF Report

Users can download the Business Intelligence report as a PDF.

---

# Machine Learning

PricePilot AI uses machine learning for demand prediction and pricing optimization.

## Models Evaluated

The following regression models were evaluated:

* Linear Regression
* Random Forest Regressor
* Gradient Boosting Regressor
* XGBoost Regressor

XGBoost is used in the final price-aware demand prediction workflow.

The model predicts demand for different price values, which is then used to calculate expected revenue and identify a suitable price recommendation.

---

# Datasets

## 1. Demand Forecasting Dataset

A demand forecasting dataset containing approximately 35,000 records and 13 features was used for demand and pricing analysis.

### Features

* Date
* Product ID
* Base Sales
* Marketing Campaign
* Marketing Effect
* Seasonal Trend
* Seasonal Effect
* Price
* Discount
* Competitor Price
* Stock Availability
* Public Holiday
* Demand

---

## 2. UCI Online Retail Dataset

The UCI Online Retail dataset is used for business analytics, product performance analysis, KPI calculation, sales analysis, and revenue intelligence.

### Dataset Features

* Invoice Number
* Stock Code
* Product Description
* Quantity
* Invoice Date
* Unit Price
* Customer ID
* Country

The dataset was cleaned and processed before being used for business analytics and machine learning workflows.

---

# Technology Stack

## Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* XGBoost

## Backend

* FastAPI
* Uvicorn
* REST APIs
* JWT Authentication

## Frontend

* React.js
* Vite
* Axios
* Recharts

## Authentication and Authorization

* JSON Web Tokens (JWT)
* Role-Based Access Control

## Database

* Application database
* Product data
* Business data
* Competitor pricing data

## Report Generation

* jsPDF
* PDF Report Generation

## Development Tools

* Jupyter Notebook
* Visual Studio Code
* Git
* GitHub
* FastAPI Swagger UI

---

# System Architecture

PricePilot AI follows a frontend-backend-machine-learning architecture.

```text
                         USER
                           |
                           v
                 +-------------------+
                 |   React Frontend  |
                 +-------------------+
                           |
                           v
              +-------------------------+
              | JWT Authentication      |
              | Role-Based Authorization|
              +-------------------------+
                           |
                           v
                 +-------------------+
                 |  FastAPI Backend  |
                 +-------------------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
      +------------+ +------------+ +------------+
      | Business   | | ML Models  | | Database   |
      | Logic      | |            | | & Data     |
      +------------+ +------------+ +------------+
             |             |
             +-------------+
                    |
                    v
       +-----------------------------+
       | Analytics / Predictions     |
       | Recommendations / Reports   |
       +-----------------------------+
                    |
                    v
             +-------------+
             | Dashboard   |
             | & Reports   |
             +-------------+
```

---

# End-to-End System Workflow

```text
User Registration / Login
          |
          v
JWT Authentication
          |
          v
Role-Based Authorization
          |
          v
Business Dashboard
          |
          v
Product KPIs
          |
          v
Product Analytics
          |
     +----+----+----------------+
     |         |                |
     v         v                v
Price      Demand          Competitor
Prediction Forecasting     Analysis
     |         |                |
     +---------+----------------+
               |
               v
      Business Recommendations
               |
               v
     Business Intelligence
               |
               v
       PDF Report Download
```

---

# Backend APIs

The FastAPI backend provides APIs for the major system modules.

## Authentication APIs

* User Registration
* User Login
* JWT Token Generation
* Protected API Access
* Role-Based Authorization

## Product and Analytics APIs

* Product Information
* Product Analytics
* Product KPIs
* Sales Analysis

## Pricing APIs

* Price Prediction
* Price Optimization
* Expected Revenue Calculation
* Price Elasticity Analysis

## Demand APIs

* Demand Prediction
* Demand Forecasting
* Weekly Demand Forecast

## Competitor APIs

* Competitor Price Comparison
* Market Position Analysis
* Competitor Price Refresh

## Business Intelligence APIs

* Business Recommendations
* Business Insights
* KPI Analysis
* Business Intelligence Data

FastAPI Swagger UI can be used to explore and test the available backend APIs.

---

# Project Structure

```text
Price-Pilot-AI/
│
├── backend/
│   │
│   ├── ai/
│   │   ├── __init__.py
│   │   └── routes.py
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── dependencies.py
│   │   └── security.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── competitor_model.py
│   │   ├── create_tables.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── seed_competitor_prices.py
│   │   └── seed_roles.py
│   │
│   ├── kpi/
│   │   └── kpi.py
│   │
│   ├── pricing/
│   │   └── routes.py
│   │
│   ├── products/
│   │   ├── __init__.py
│   │   └── products.py
│   │
│   ├── create_admin.py
│   └── main.py
│
├── data/
│   ├── create_product_categories.py
│   └── import_retail_data.py
│
├── frontend/
│   │
│   ├── src/
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AIInsights.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── BIReports.jsx
│   │   │   ├── BusinessAnalystDashboard.jsx
│   │   │   ├── CompetitorAnalysis.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DemandForecasting.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PricePrediction.jsx
│   │   │   ├── ProductAnalytics.jsx
│   │   │   ├── Register.jsx
│   │   │   └── UserDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── package-lock.json
│
├── llm/
│   └── llm_service.py
│
├── models/
│   │
│   ├── models/
│   │   ├── price_aware_demand_model.json
│   │   └── price_aware_model_features.pkl
│   │
│   ├── M5_Demand_Forecasting_Model.ipynb
│   ├── Online_Retail_Demand_Forecasting.ipynb
│   ├── demand_prediction_model.pkl
│   ├── online_retail_demand_features.pkl
│   ├── online_retail_demand_model.json
│   └── online_retail_weekly_data.csv
│
├── seed_competitor_data.py
├── .gitignore
└── README.md
```


# Milestone 3 Requirement Mapping

| Requirement             | Implemented Feature                           |
| ----------------------- | --------------------------------------------- |
| Role-Based Management   | Admin, Business Analyst and User roles        |
| Authentication          | JWT-based authentication                      |
| Authorization           | Role-based access control                     |
| Product KPIs            | Revenue, sales, products and orders           |
| Price Prediction        | XGBoost-based price-aware demand prediction   |
| Demand Forecasting      | Weekly demand forecasting                     |
| Confidence Score        | Forecast confidence information               |
| Competitor Analysis     | Competitor price comparison                   |
| Market Intelligence     | Market position and competitor analysis       |
| Revenue Optimization    | Candidate price and expected revenue analysis |
| Pricing Recommendations | Automated pricing recommendations             |
| Business Intelligence   | KPI and product performance analysis          |
| Downloadable Report     | PDF Business Intelligence Report              |

---

# Security

PricePilot AI uses JWT-based authentication and role-based authorization.

Security features include:

* User authentication
* JWT token authentication
* Protected backend endpoints
* Role-based access control
* Privileged Admin account creation
* Restricted access to role-specific modules

Sensitive configuration values should be stored in environment variables and should not be committed to the repository.

---

# Future Scope

## AI Assistant / Chatbot

A conversational AI assistant can be added to allow users to ask natural-language questions about:

* Sales
* Revenue
* Product performance
* Pricing
* Demand
* Competitors

## External LLM Integration

An external Large Language Model can be integrated for:

* Advanced business recommendations
* Natural-language explanations
* Automated report summaries
* Business question answering
* Context-aware pricing insights

## Real-Time Competitor Monitoring

Future versions can implement automated competitor price monitoring.

The system can detect competitor price changes and provide alerts to business users.

## Advanced Demand Forecasting

Future versions can explore advanced forecasting techniques for:

* Short-term forecasting
* Medium-term forecasting
* Long-term forecasting
* Seasonal demand prediction
* Product-level forecasting
* Market trend analysis

## Advanced Pricing Optimization

Future versions can explore:

* Dynamic pricing
* Discount optimization
* Promotion optimization
* Profit optimization
* Market-aware pricing
* Customer-aware pricing

# Conclusion

PricePilot AI combines machine learning, pricing optimization, demand forecasting, competitor analysis, product analytics, authentication, automated recommendations, and business intelligence into a unified platform.

The system enables businesses to:

* Analyze product performance
* Monitor competitive pricing
* Forecast product demand
* Evaluate pricing opportunities
* Optimize expected revenue
* Understand business KPIs
* Generate automated business recommendations
* Generate downloadable business intelligence reports

The platform provides an end-to-end foundation for data-driven pricing and revenue optimization.
