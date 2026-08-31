# PricePilot AI — First Milestone

## 1. Project Title

**PricePilot AI: Dynamic Pricing Optimization & Revenue Intelligence System**

---

## 2. Milestone 1 Objective

The objective of the first milestone is to establish the basic foundation of the PricePilot AI system.

The milestone covers:

- Project setup
- Dataset collection and analysis
- Data preprocessing
- Exploratory Data Analysis (EDA)
- Feature engineering
- Database design and MySQL setup
- Machine learning model development
- Model evaluation
- Initial FastAPI backend integration
- GitHub collaboration
- Project documentation

---

## 3. Project Structure

```text
PricePilot-AI/
│
├── backend/
│   ├── data_preprocessing.py
│   ├── eda.py
│   ├── feature_engineering.py
│   ├── model_training.py
│   ├── predict.py
│   ├── db_connection.py
│   ├── test_database.py
│   └── main.py
│
├── data/
│   ├── raw/
│   │   └── sales_data.csv
│   │
│   └── processed/
│       ├── clean_sales_data.csv
│       └── ml_ready_data.csv
│
├── database/
│   └── schema.sql
│
├── models/
│   └── demand_model.pkl
│
├── docs/
│   ├── architecture.md
│   ├── database_design.md
│   ├── dataset_notes.md
│   ├── eda_notes.md
│   ├── feature_engineering.md
│   ├── feature_selection.md
│   ├── model_training.md
│   ├── tech_stack.md
│   └── milestone1.md
│
├── .gitignore
├── README.md
└── requirements.txt
```

## System Architecture

                    ┌─────────────────────┐
                    │    Sales Dataset    │
                    │   sales_data.csv    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Data Preprocessing  │
                    │ data_preprocessing  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        EDA          │
                    │   Data Analysis     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Feature Engineering│
                    │  ML-ready Dataset   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Random Forest     │
                    │ Demand Prediction   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  demand_model.pkl   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Prediction API      │
                    │   /api/predict      │
                    └─────────────────────┘

          ┌──────────────────────────────┐
          │       MySQL Database         │
          │       pricepilot_db          │
          │                              │
          │ Products | Stores | Pricing  │
          │ Sales    | Inventory         │
          └──────────────────────────────┘