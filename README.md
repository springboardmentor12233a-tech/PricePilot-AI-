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
- Total revenue.
- Total sales.
- Total products.
- Unique orders.

### Product Analytics
- Product price and units sold.
- Revenue and transaction details.
- Average selling price.
- Monthly sales trends.
- Product and category performance.

### Price Prediction & Optimization
- XGBoost-based demand prediction.
- Candidate price evaluation.
- Expected revenue calculation.
- Recommended price.
- Price change percentage.
- Predicted demand.
- Price elasticity analysis.

### Demand Forecasting
- Product-level demand forecasting.
- Weekly demand forecasts.
- Forecast visualizations.
- Weekly demand breakdown.
- Forecast confidence information.

### Competitor Analysis
- Current product price.
- Average competitor price.
- Lowest and highest competitor prices.
- Market position analysis.
- Price differences and percentage differences.
- Competitor price comparison.

### AI Recommendations
- Automated business recommendations.
- Pricing and demand insights.
- Product performance insights.
- Competitor pricing insights.
- High, Medium, and Low priority recommendations.

### Business Intelligence Reports
- Business KPI summaries.
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
- JWT authentication

### Frontend
- React.js
- Vite
- Axios
- Recharts

### Report Generation
- jsPDF

### Development Tools
- Jupyter Notebook
- Visual Studio Code
- Git
- GitHub
- FastAPI Swagger UI

---

## Machine Learning Approach

The project explores regression models for demand prediction and pricing analysis, including:

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor
- XGBoost Regressor

XGBoost is used in the price-aware demand prediction workflow.

The model predicts demand for different candidate prices. The predicted demand is used to calculate expected revenue and identify a suitable price recommendation.

---

## Datasets

### Demand Forecasting Dataset

A dataset containing approximately 35,000 records and 13 features was used for demand and pricing analysis.

Key features include:

- Date
- Product ID
- Base Sales
- Price
- Discount
- Competitor Price
- Marketing Campaign
- Marketing Effect
- Seasonal Trend
- Seasonal Effect
- Stock Availability
- Public Holiday
- Demand

### UCI Online Retail Dataset

The Online Retail dataset is used for business analytics, product performance analysis, and revenue intelligence.

Applications include:

- Product performance analysis.
- Revenue calculations.
- Sales analysis.
- Business KPI generation.
- Product ranking by quantity and revenue.

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
```

---

## End-to-End Workflow

```text
Registration / Login
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
   +-----+-----+----------------+
   |           |                |
   v           v                v
Price       Demand          Competitor
Prediction  Forecasting     Analysis
   |           |                |
   +-----------+----------------+
               |
               v
     Business Recommendations
               |
               v
     Business Intelligence
               |
               v
          PDF Reports
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

## API Testing and Validation

FastAPI Swagger UI was used to test the backend endpoints and verify their responses.

### API Tests Performed

| Feature | Test Result |
|---|---|
| User Registration | Passed |
| Login and JWT Token Generation | Passed |
| Authenticated User Details | Passed |
| Business Analyst Access | Passed |
| Admin Access Restriction | Passed |
| User Endpoint Access | Passed |
| Product Analytics | Passed |
| Price Prediction | Passed |
| Demand Forecasting | Passed |
| Competitor Analysis | Passed |
| KPI Summary | Passed |

### Functional Testing

The frontend was tested for form validation, authentication, navigation, and module accessibility.

- **Registration:** Empty-field validation and invalid email validation were verified.
- **Password Validation:** Short passwords and passwords missing required character types were rejected.
- **Login:** Invalid credentials were rejected with an appropriate error message.
- **Successful Login:** Valid credentials opened the appropriate dashboard.
- **Role-Based Access:** Authorized access and restricted access were tested.
- **Navigation:** Application pages redirected to their respective modules.
- **AI Recommendations:** Recommendations and business insights displayed correctly.
- **BI Reports:** Business metrics, charts, and report information displayed correctly.

The tested functionality worked as expected during manual testing.

Machine learning performance metrics, such as MAE and RMSE, have not been evaluated as part of these tests.

---

## Running the Project

### Prerequisites

- Python installed.
- Node.js and npm installed.
- Git installed.

### Backend Setup

Open a terminal and execute:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed in the terminal.

---

## Future Scope

- AI assistant and chatbot integration.
- External Large Language Model (LLM) integration.
- Natural-language business queries.
- Real-time competitor price monitoring.
- Advanced demand forecasting.
- Improved dynamic pricing algorithms.
- Automated alerts and notifications.
- Advanced market intelligence.
- Comprehensive model evaluation and performance monitoring.

---

## Conclusion

PricePilot AI combines machine learning, price optimization, demand forecasting, competitor analysis, product analytics, authentication, automated recommendations, and business intelligence into a unified platform.

The application provides business users with tools to analyze product performance, understand market pricing, forecast demand, and make data-driven pricing decisions. API and functional testing verified the main application workflows and access controls.

PricePilot AI provides a foundation for data-driven pricing and revenue intelligence, with further opportunities to improve model evaluation and predictive performance.
