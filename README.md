# PricePilot AI

## Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an AI-powered platform that helps businesses make better pricing, demand, and revenue decisions using machine learning, demand forecasting, competitor analysis, product analytics, and business intelligence.

The platform provides an end-to-end workflow for analyzing business performance, predicting demand, optimizing prices, comparing competitor prices, generating recommendations, and creating downloadable business intelligence reports.

---

## Project Objectives

- Predict product demand using machine learning.
- Generate suitable price recommendations.
- Optimize pricing based on predicted demand and revenue.
- Forecast future product demand.
- Analyze competitor pricing and market position.
- Calculate important business KPIs.
- Analyze product-level performance.
- Generate automated business recommendations.
- Implement authentication and role-based authorization.
- Generate downloadable business intelligence reports.

---

## Key Features

### Authentication & Role-Based Access
- JWT-based authentication.
- Role-based authorization.
- Admin, Business Analyst, and User roles.
- Protected role-specific modules.

### Business Dashboard
- Total Revenue
- Total Sales
- Total Products
- Unique Orders

### Product Analytics
- Product price
- Units sold
- Revenue
- Transactions
- Average selling price
- Sales trends
- Category and product performance

### Price Prediction & Optimization
- XGBoost-based demand prediction.
- Candidate price evaluation.
- Expected revenue calculation.
- Recommended price.
- Price change percentage.
- Predicted demand.
- Price elasticity.

### Demand Forecasting
- Product and category selection.
- Weekly demand forecasting.
- Forecast visualization.
- Weekly demand breakdown.
- Forecast confidence information.

### Competitor Analysis
- Current product price.
- Average competitor price.
- Lowest and highest competitor price.
- Market position.
- Price difference and percentage difference.
- Competitor comparison.

### AI Recommendations
- Automated business recommendations.
- Pricing and demand insights.
- Product performance insights.
- Competitor pricing insights.
- High, Medium, and Low priority recommendations.

### Business Intelligence Reports
- Business KPIs.
- Top products by quantity.
- Top products by revenue.
- Business insights.
- Downloadable PDF reports.

---

## Technology Stack

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
- JWT

### Frontend
- React.js
- Vite
- Axios
- Recharts

### Reports
- jsPDF

### Tools
- Jupyter Notebook
- VS Code
- Git
- GitHub
- FastAPI Swagger UI

---

## Machine Learning

The project evaluates:

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor
- XGBoost Regressor

XGBoost is used for the final price-aware demand prediction workflow.

The model predicts demand for different prices, which is then used to calculate expected revenue and identify a suitable price recommendation.

---

## Datasets

### Demand Forecasting Dataset

A dataset containing approximately 35,000 records and 13 features was used for demand and pricing analysis.

Key features include:

- Date
- Product ID
- Sales
- Price
- Discount
- Competitor Price
- Marketing information
- Seasonal information
- Stock Availability
- Public Holiday
- Demand

### UCI Online Retail Dataset

Used for:

- Business analytics
- Product performance
- KPI analysis
- Sales analysis
- Revenue intelligence

---

## System Architecture

```text
                    User
                     |
                     v
              React Frontend
                     |
                     v
          JWT Authentication
          & Role Authorization
                     |
                     v
             FastAPI Backend
                     |
          +----------+----------+
          |          |          |
          v          v          v
      Business      ML       Database
       Logic      Models       Data
          |          |
          +----------+
                |
                v
       Analytics & Predictions
                |
                v
       Recommendations & Reports
                |
                v
          Dashboard / PDF
````

---

## End-to-End Workflow

```text
Login / Registration
        |
        v
JWT Authentication
        |
        v
Role-Based Access
        |
        v
Business Dashboard
        |
        v
Product Analytics
        |
   +----+----+----------------+
   |         |                |
   v         v                v
Price     Demand          Competitor
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
       PDF Report
```

---

## Project Structure

```text
Price-Pilot-AI/
│
├── backend/
│   ├── ai/
│   ├── auth/
│   ├── database/
│   ├── kpi/
│   ├── pricing/
│   ├── products/
│   ├── create_admin.py
│   └── main.py
│
├── data/
│   ├── create_product_categories.py
│   └── import_retail_data.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── package-lock.json
│
├── llm/
│   └── llm_service.py
│
├── models/
│   ├── models/
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

---

## Milestone 3

### Competitor Analysis & Revenue Optimization

Milestone 3 includes:

* Role-based authentication and authorization.
* Product KPIs and analytics.
* Price prediction and revenue optimization.
* Demand forecasting.
* Competitor analysis.
* Market intelligence.
* Automated pricing recommendations.
* Business intelligence.
* Downloadable PDF reports.

### Requirement Mapping

| Requirement           | Implementation                   |
| --------------------- | -------------------------------- |
| Role-Based Management | Admin, Business Analyst, User    |
| Authentication        | JWT                              |
| Authorization         | Role-Based Access                |
| Product KPIs          | Revenue, Sales, Products, Orders |
| Price Prediction      | XGBoost                          |
| Demand Forecasting    | Weekly Forecasting               |
| Competitor Analysis   | Price Comparison                 |
| Market Intelligence   | Market Position Analysis         |
| Revenue Optimization  | Expected Revenue Analysis        |
| Recommendations       | Automated Recommendations        |
| Business Intelligence | KPI & Product Analysis           |
| Reports               | Downloadable PDF                 |

---

## Running the Project

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Future Scope

* AI Assistant / Chatbot.
* External LLM integration.
* Natural-language business queries.
* Real-time competitor monitoring.
* Advanced demand forecasting.
* Advanced dynamic pricing.
* Automated alerts and notifications.
* Advanced market intelligence.

---

## Conclusion

PricePilot AI combines machine learning, pricing optimization, demand forecasting, competitor analysis, product analytics, authentication, automated recommendations, and business intelligence into a unified platform.

It provides an end-to-end foundation for data-driven pricing and revenue optimization.
