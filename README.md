# PricePilot AI

### Dynamic Pricing Optimization and Revenue Intelligence System

## 📌 Project Overview

PricePilot AI is an AI-powered dynamic pricing and revenue intelligence system designed to help businesses make data-driven pricing decisions.

The system analyzes sales data, product demand, inventory levels, and pricing information to support demand prediction, price recommendations, and business analysis.

It provides API endpoints for product retrieval, authentication, demand prediction, pricing recommendations, and AI-generated insights.

## 🎯 Objectives

- Predict product demand using machine learning.
- Recommend suitable product prices.
- Analyze pricing and sales-related information.
- Retrieve product information and business KPIs.
- Generate AI-based insights and recommendations.
- Combine multiple analyses through a single API endpoint.
- Support data-driven business decisions.

## 🛠️ Technologies Used

- **Programming Language:** Python
- **Backend Framework:** FastAPI
- **ASGI Server:** Uvicorn
- **Database:** MySQL
- **Machine Learning:** Python-based prediction model
- **API Testing:** FastAPI Swagger UI / Postman
- **Version Control:** Git and GitHub

## ⚙️ Key Features

### 1. User Authentication
Provides a login endpoint for validating user credentials.

### 2. Product Retrieval
Retrieves product information through the API.

### 3. Demand Prediction
Uses the configured machine learning model to predict product demand.

### 4. Price Recommendation
Provides recommended product prices based on the implemented pricing logic.

### 5. Pricing Analysis
Processes pricing requests and returns pricing-related results.

### 6. Complete Analysis
Combines applicable analysis results, such as demand forecasts, inventory information, pricing results, and AI insights.

### 7. AI Insights
Provides AI-generated insights when the required language model service is configured.

### 8. Database Connectivity
Checks the connection between the backend and the configured MySQL database.

## 🏗️ System Architecture

The application follows a backend API architecture.

1. **Client Layer:** Sends requests through Swagger UI or another API client.
2. **API Layer:** FastAPI receives and processes requests.
3. **Authentication Layer:** Validates user credentials.
4. **Machine Learning Layer:** Processes supported demand prediction requests.
5. **Database Layer:** Connects to MySQL for supported data operations.
6. **Analysis Layer:** Produces pricing results, forecasts, and AI insights where implemented.
7. **Response Layer:** Returns results in JSON format.

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Returns the API welcome message |
| GET | `/api/health` | Checks backend health |
| GET | `/api/database` | Checks database connectivity |
| GET | `/api/products` | Retrieves product information |
| POST | `/api/auth/login` | Authenticates users |
| POST | `/api/predict` | Predicts product demand |
| POST | `/api/recommend-price` | Recommends a product price |
| POST | `/api/complete-analysis` | Returns combined analysis results |
| POST | `/api/pricing` | Processes pricing requests |
| POST | `/api/ai-insight` | Generates AI insights when configured |

## 🧪 API Testing

API testing is performed using FastAPI Swagger UI and/or Postman.

### Test Cases

| Test ID | Test Case | Expected Result |
|---|---|---|
| TC01 | API Root | Welcome message returned |
| TC02 | API Health Check | HTTP 200 and healthy status |
| TC03 | Database Connection | Database connection status returned |
| TC04 | Product Retrieval | Product data returned |
| TC05 | Valid Admin Login | Successful login with token and admin role |
| TC06 | Invalid Login | Invalid credentials rejected |
| TC07 | Demand Prediction | Predicted demand returned for a valid row |
| TC08 | Invalid Prediction Row | Invalid row handled appropriately |
| TC09 | Price Recommendation | Recommended price returned |
| TC10 | Complete Analysis | Combined analysis response returned |
| TC11 | Pricing Endpoint | Pricing result returned for valid input |
| TC12 | AI Insight | AI insight returned if the service is configured |

### Test Summary

The test case report lists 12 test cases.

Update the results below to reflect the tests you have actually executed.

| Metric | Result |
|---|---:|
| Total Test Cases | 12 |
| Passed | Update after verification |
| Failed | Update after verification |
| Not Executed | Update after verification |
| Pass Rate | Recalculate after verification |

**Pass Rate Formula:**

Pass Rate = (Passed Test Cases / Total Executed Test Cases) × 100

> Note: The test case descriptions and expected results are documented in the test report. Confirm the actual response of each endpoint before marking it as passed.

## 🚀 Installation and Setup

### Prerequisites

- Python installed
- MySQL Server installed and configured
- Git installed

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd PricePilot-AI

## Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an AI-powered dynamic pricing and revenue intelligence platform designed to help businesses make intelligent pricing decisions using market demand, competitor pricing, customer behavior, sales performance, inventory, and other business factors.

The platform aims to optimize product prices, improve profitability, analyze competitors, forecast demand, and provide pricing insights through a centralized business intelligence platform.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Project Modules](#project-modules)
- [Dataset](#dataset)
- [Dataset Analysis](#dataset-analysis)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development Roadmap](#development-roadmap)
- [Milestones](#milestones)
- [Performance Metrics](#performance-metrics)
- [Installation](#installation)
- [How to Run](#how-to-run)
- [Git and Collaboration](#git-and-collaboration)
- [Expected Outcomes](#expected-outcomes)
- [Future Enhancements](#future-enhancements)
- [Project Status](#project-status)

---

## Project Overview

PricePilot AI provides a centralized platform for pricing optimization and revenue intelligence.

The system will analyze historical sales, pricing, inventory, promotions, competitor pricing, seasonal factors, and market-related information to generate useful pricing and demand insights.

### Target Use Cases

- E-commerce businesses
- Retail businesses
- Marketplaces
- Airlines
- Hotels
- Subscription platforms
- Sales teams

---

## Problem Statement

Businesses often need to decide the right price for products while considering changing customer demand, competitor prices, inventory levels, promotions, seasonal trends, and sales performance.

Traditional pricing approaches may not respond effectively to these changing factors.

PricePilot AI addresses this problem by providing an AI-powered platform for:

- Dynamic pricing analysis
- Demand forecasting
- Price prediction
- Competitor analysis
- Revenue optimization
- Pricing analytics

---

## Objectives

The main objectives of PricePilot AI are:

1. Analyze historical sales and pricing data.
2. Understand the relationship between price and demand.
3. Forecast future product demand.
4. Predict suitable product prices.
5. Analyze competitor pricing.
6. Optimize revenue and profitability.
7. Provide pricing strategy recommendations.
8. Provide interactive pricing and business intelligence dashboards.
9. Provide reliable forecasting and pricing insights.

---


# System Architecture

The planned high-level architecture is:

```text
                         ┌──────────────────────┐
                         │        User          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React.js /         │
                         │   Next.js Frontend   │
                         └──────────┬───────────┘
                                    │
                               REST APIs
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       FastAPI        │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
       │   MySQL     │       │    Data     │       │  ML Models   │
       │  Database   │       │ Processing  │       │              │
       └─────────────┘       └─────────────┘       └──────┬───────┘
                                                          │
                              ┌───────────────────────────┼──────────────┐
                              │                           │              │
                              ▼                           ▼              ▼
                       Price Prediction          Demand Forecasting   Analytics
                              │                           │              │
                              └───────────────────────────┼──────────────┘
                                                          │
                                                          ▼
                                             Pricing Recommendations
                                                          │
                                                          ▼
                                                 Business Dashboard

```
                                           
## Data Flow

```text
Raw Dataset
     │
     ▼
Data Validation
     │
     ▼
Data Preprocessing
     │
     ▼
Processed Dataset
     │
     ├──────────────────► MySQL Database
     │
     └──────────────────► Machine Learning
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             Price Prediction       Demand Forecasting
                    │                       │
                    └───────────┬───────────┘
                                ▼
                     Pricing Intelligence
                                │
                                ▼
                           Dashboard
                           
```                           
## Project Modules

The project is organized into the following major modules:

### Data Management

Responsible for:

Dataset loading
Data validation
Data preprocessing
Data quality checks

### Database Management

Responsible for:

Product information
Store information
Pricing records
Historical sales data

### Machine Learning

Responsible for:

Price prediction
Demand forecasting
Pricing recommendations

### Competitor Analysis

Responsible for:

Competitor price comparison
Market analysis
Competitive pricing insights

### Revenue Intelligence

Responsible for:

Revenue analysis
Profitability analysis
Pricing optimization

### Business Dashboard

Responsible for:

Analytics
Visualizations
Pricing insights
Forecasting results

## Dataset

### Dataset Name
Retail Store Inventory and Demand Forecasting

### Dataset Source
Kaggle

### Raw Dataset
data/raw/sales_data.csv

The raw dataset is preserved separately and is used as the source for data preprocessing and analysis.

```
 
```
## Technology Stack

### Programming Languages
Python
JavaScript
### Backend
FastAPI
### Frontend
React.js
Next.js
### Database
MySQL
### Data Analysis
Pandas
NumPy
Matplotlib
### Machine Learning

Planned:

Scikit-learn
XGBoost
Random Forest
TensorFlow
### Forecasting

Planned:

ARIMA
Prophet
XGBoost
Random Forest
LSTM
### Development & Collaboration
Visual Studio Code
Google Colab
Git
GitHub
### Deployment

Planned:

Docker
Docker Compose
AWS / Azure

# Project Structure

```text
PricePilot-AI
│
├── 📁 backend
│   ├── 📄 data_preprocessing.py
│   ├── 📄 db_connection.py
│   └── 📄 main.py
│
├── 📁 frontend
│   └── 📄 ...
│
├── 📁 data
│   ├── 📁 raw
│   │   └── 📄 sales_data.csv
│   │
│   └── 📁 processed
│       └── 📄 clean_sales_data.csv
│
├── 📁 database
│   └── 📄 schema.sql
│
├── 📁 models
│   └── 📄 ...
│
├── 📁 notebooks
│   └── 📓 PricePilot_AI_EDA.ipynb
│
├── 📁 docs
│   ├── 📄 architecture.md
│   ├── 📄 dataset_notes.md
│   ├── 📄 day1_progress.md
│   └── 📄 tech_stack.md
│
├── 📄 .gitignore
├── 📄 README.md
└── 📄 requirements.txt
```
