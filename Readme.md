# PricePilot AI

## Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an AI-powered pricing intelligence platform designed to support dynamic pricing, demand forecasting, competitor analysis, revenue optimization, and pricing analytics.

The system is being developed as a modular end-to-end application combining data analytics, machine learning, backend APIs, and business intelligence.

## Project Objectives

The project aims to develop capabilities for:

* Product and pricing data management
* Price prediction
* Demand forecasting
* Competitor price analysis
* Revenue and profitability analysis
* Pricing recommendations
* Pricing analytics dashboards

## Current Development Status

### Milestone 1 — Data & Exploratory Analysis

Current work:

* Project structure
* Dataset collection
* Data loading
* Data quality analysis
* Data preprocessing
* Exploratory data analysis
* Initial feature identification

Future milestones will cover machine learning, forecasting, pricing recommendations, competitor analysis, revenue optimization, backend APIs, frontend dashboards, testing, and deployment.

## Project Structure

```text
PricePilot-AI/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── notebooks/
│   ├── 01_data_loading.ipynb
│   ├── 02_data_cleaning.ipynb
│   └── 03_eda.ipynb
│
├── src/
│   ├── data/
│   ├── features/
│   └── visualization/
│
├── reports/
│   └── figures/
│
├── backend/
├── frontend/
├── tests/
├── docs/
│
├── .gitignore
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Datasets

### Retail Price Optimization

Source:

https://www.kaggle.com/datasets/suddharshan/retail-price-optimization

Used for analysis of product pricing, sales quantity, revenue, product categories, and related pricing variables.

### Retail Store Inventory Forecasting

Source:

https://www.kaggle.com/datasets/anirudhchauhan/retail-store-inventory-forecasting-dataset

Used for demand, inventory, sales, temporal and forecasting-related analysis.

### Online Retail II

Source:

https://archive.ics.uci.edu/dataset/502/online%2Bretail

An optional transaction-level dataset that may be incorporated in later development.

## Installation

Clone or download this repository and create a Python virtual environment.

```bash
python -m venv .venv
```

Activate the environment.

### Windows

```bash
.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Data Setup

Raw datasets should be placed under:

```text
data/raw/
```

Example:

```text
data/raw/
├── retail_price/
│   └── retail_price.csv
│
└── inventory/
    └── retail_store_inventory.csv
```

Raw datasets are excluded from Git using `.gitignore`.

## Exploratory Data Analysis

The EDA notebooks examine:

* Dataset structure
* Data types
* Missing values
* Duplicate records
* Descriptive statistics
* Product performance
* Category performance
* Price distributions
* Price-demand relationships
* Revenue patterns
* Time-series trends
* Correlations
* Potential machine-learning features

## Docker

PostgreSQL and pgAdmin are provided through Docker Compose.

Start the services:

```bash
docker compose up -d
```

Stop the services:

```bash
docker compose down
```

Check running containers:

```bash
docker compose ps
```

## Technology Stack

### Data & Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* XGBoost
* TensorFlow
* Prophet

### Backend

* FastAPI
* PostgreSQL

### Frontend

* React.js / Next.js
* Tailwind CSS
* Recharts / Chart.js

### DevOps

* Docker
* Docker Compose
* Git
* GitHub

## Development Roadmap

### Milestone 1

* Project initialization
* Dataset integration
* Data preprocessing
* Exploratory data analysis
* Initial architecture

### Milestone 2

* Price prediction
* Demand forecasting
* Price recommendation
* Forecast analysis

### Milestone 3

* Competitor analysis
* Revenue optimization
* Profitability analysis
* Pricing strategy recommendations

### Milestone 4

* Testing
* Docker deployment
* Cloud deployment
* Documentation
* Final demonstration

## Disclaimer

The current repository represents an active development project. Machine-learning models, pricing recommendations, and production APIs are implemented progressively as development milestones are completed.
