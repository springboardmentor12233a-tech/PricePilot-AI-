# PricePilot AI

### Dynamic Pricing Optimization & Revenue Intelligence System

An AI-powered platform that helps businesses optimize product prices based on market demand, competitor pricing, customer behavior, and sales performance — supporting price prediction, demand forecasting, competitor analysis, and revenue optimization through a centralized platform.

---

## 🎯 Project Objective

Build an AI-powered dynamic pricing platform that maximizes revenue, improves profitability, enhances market competitiveness, and supports intelligent pricing decisions using machine learning — applicable across e-commerce, retail, marketplaces, airlines, hotels, subscription platforms, and sales teams.

---

## 📊 Milestone 1: Data Collection, EDA & Preprocessing ✅

**Status: Completed**

This phase focused on sourcing, exploring, and preparing real-world datasets to power the platform's pricing and demand intelligence engine.

### Datasets Used

| # | Dataset | Source | Purpose |
|---|---------|--------|---------|
| 1 | Retail Pricing & Demand Signals | [Kaggle](https://www.kaggle.com/datasets/noopurbhatt/retail-pricing-and-demand-signals-dataset) | Retail pricing patterns |
| 2 | Dynamic Pricing Dataset | [Kaggle](https://www.kaggle.com/datasets/arashnic/dynamic-pricing-dataset) | Core dynamic pricing mechanics |
| 3 | Online Retail II (UCI) | [Kaggle](https://www.kaggle.com/datasets/mashlyn/online-retail-ii-uci) | E-commerce sales & customer behavior |
| 4 | Walmart Dataset | [Kaggle](https://www.kaggle.com/datasets/yasserh/walmart-dataset) | Historical sales, inventory & market/economic data |
| 5 | Amazon Products 2023 | [Kaggle](https://www.kaggle.com/datasets/asaniczka/amazon-products-dataset-2023-1-4m-products) | Product catalog & attributes |
| 6 | Amazon UK Products 2023 | [Kaggle](https://www.kaggle.com/datasets/asaniczka/amazon-uk-products-dataset-2023) | Competitor pricing data |

### What Was Done

- ✅ **Data Collection** — Sourced and organized 6 real-world datasets covering ~4.8 million records
- ✅ **Exploratory Data Analysis (EDA)** — For each dataset: structure inspection, missing value analysis, duplicate detection, statistical summaries, and validity checks
- ✅ **Data Visualization** — Individual charts and combined dashboards per dataset, revealing pricing trends, category distributions, demand patterns, and regional/seasonal insights
- ✅ **Data Preprocessing** — Missing value handling, duplicate removal, invalid record filtering, data type correction, and column standardization
- ✅ **Data Export** — Clean, analysis-ready datasets saved for downstream use in price prediction and demand forecasting models

### Key Findings

- Datasets were largely clean, with targeted issues identified and resolved per dataset (e.g., missing promotion labels, cancelled transaction removal, zero-price listings)
- Combined dataset volume after cleaning: **~4.8 million records** across pricing, sales, and product domains
- Clear pricing, demand, and seasonal patterns identified — validating feasibility for downstream ML models

---

## 🛠️ Tools & Technologies

- **Language:** Python
- **Libraries:** Pandas, NumPy, Matplotlib, Seaborn
- **Environment:** VS Code, Jupyter Notebooks
- **Version Control:** Git & GitHub

---

## 📁 Project Structure
PricePilot-AI/
├── notebooks/ # EDA & preprocessing notebooks (one per dataset)
├── data/
│ ├── raw/ # Original datasets (not tracked in Git)
│ └── processed_data/ # Cleaned, analysis-ready datasets (not tracked in Git)
├── docs/ # Project documentation
├── src/ # Application source code (backend & frontend)
├── requirements.txt # Python dependencies
└── README.md

