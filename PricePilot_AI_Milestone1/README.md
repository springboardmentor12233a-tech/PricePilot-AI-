# PricePilot AI: Dynamic Pricing Optimization & Revenue Intelligence System
### Milestone 1 Delivery Package (Weeks 1 & 2)

---

## 📂 Folder Structure

```
PricePilot_AI_Milestone1/
├── frontend/
│   └── index.html                          # Complete Interactive Web Dashboard
├── backend/
│   ├── app/
│   │   ├── api/                            # Auth, Products, Analytics, Datasets Routers
│   │   ├── core/                           # Config, Security & JWT
│   │   ├── db/                             # SQLAlchemy Session Engine
│   │   ├── models/                         # User, Product, PriceHistory, Sales Models
│   │   ├── schemas/                        # Pydantic v2 validation schemas
│   │   ├── services/                       # Database Seeder Service
│   │   └── main.py                         # FastAPI Application Entrypoint
│   ├── tests/
│   │   └── test_api.py                     # Automated Pytest Suite (7/7 Passed)
│   ├── conftest.py
│   └── requirements.txt
├── data/
│   ├── integrated_pricing_demand_dataset.csv  # Unified Master Dataset (7,300 rows x 31 cols)
│   ├── retail_price_optimization.csv          # Competitor Feeds Dataset
│   ├── favorita_store_sales.csv               # Time-Series Demand Dataset
│   ├── brazilian_ecommerce_olist.csv          # E-Commerce Transactions Dataset
│   ├── amazon_product_pricing.csv             # Catalog MSRP Dataset
│   ├── PricePilot_AI_EDA_and_Dataset_Integration.ipynb  # Interactive Jupyter Notebook
│   ├── PricePilot_AI_EDA_Script.py            # Standalone Python EDA Script
│   └── EDA_REPORT.md                          # Full Markdown EDA Report
├── docs/
│   ├── ARCHITECTURE_AND_SCHEMA.md             # System Architecture & DB DDL Specification
│   └── MILESTONE_1_REPORT.md                  # Milestone 1 Comprehensive Report
├── run_milestone1.bat                         # 1-Click Launch Script
└── README.md
```

---

## 🚀 How to Run Milestone 1

### 1. View the Interactive Dashboard UI:
Double-click `frontend/index.html` to open the interactive Pricing and Revenue Intelligence Dashboard directly in any web browser.

### 2. Run the EDA Jupyter Notebook:
Open `data/PricePilot_AI_EDA_and_Dataset_Integration.ipynb` in **JupyterLab**, **VS Code**, or **Google Colab**.

### 3. Run the Backend API & Tests:
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API Documentation will be available at `http://127.0.0.1:8000/docs`.

To run automated tests:
```powershell
pytest tests/test_api.py -v
```
