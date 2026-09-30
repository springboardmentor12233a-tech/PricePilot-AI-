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
- Implement authentication and role-based authorization.
- Generate downloadable business intelligence reports.
- Provide an end-to-end pricing and revenue optimization workflow.

---

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
- REST APIs
- JWT Authentication

### Frontend

- React.js
- Vite
- Axios
- Recharts

### Authentication & Authorization

- JSON Web Tokens (JWT)
- Role-Based Access Control

### Database

- Application database
- Product data
- Business data
- Competitor pricing data

### Report Generation

- jsPDF
- PDF Report Generation

### Development Tools

- Jupyter Notebook
- Visual Studio Code
- Git
- GitHub
- FastAPI Swagger UI

---

# System Features

## 1. User Authentication and Role-Based Access

PricePilot AI implements secure JWT-based authentication and role-based authorization.

The system supports three roles:

### Admin

Admin users have access to:

- Dashboard
- Product Analytics
- Price Prediction
- Demand Forecasting
- Administrative functionality

### Business Analyst

Business Analysts have access to:

- Dashboard
- Product Analytics
- Price Prediction
- Demand Forecasting
- Competitor Analysis
- AI Recommendations
- Business Intelligence Reports

### User

Normal users have access to:

- Dashboard
- Product Analytics
- Basic business information

The Admin account is created separately through the backend and is not available as an option during normal user registration.

---

# 2. Business Dashboard

The Business Dashboard provides an overview of the organization's business performance.

### Key Performance Indicators

- Total Revenue
- Total Sales
- Total Products
- Unique Orders

The dashboard provides a centralized view of important business metrics.

---

# 3. Product Analytics

The Product Analytics module provides detailed product-level analysis.

### Product KPIs

- Product Price
- Units Sold
- Revenue
- Total Transactions
- Average Selling Price

### Product Analytics Includes

- Sales trends
- Category performance
- Product performance
- Historical sales analysis
- Product-level KPIs

The system displays the latest 12 months of sales information for selected products.

---

# 4. Price Prediction and Revenue Optimization

The Price Prediction module uses machine learning to estimate demand at different price points.

The system tests multiple candidate prices and predicts:

- Demand
- Expected Revenue

The price producing the highest predicted revenue is selected as the recommended price.

### Price Prediction Results

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

### Price Optimization Workflow

```text
Product Data
     |
     v
Current Price
     |
     v
Generate Candidate Prices
     |
     v
Predict Demand
     |
     v
Calculate Expected Revenue
     |
     v
Compare Candidate Prices
     |
     v
Recommended Price
