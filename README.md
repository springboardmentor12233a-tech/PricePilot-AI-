# PricePilot AI — Milestone 2 FINAL
## Real datasets: Online Retail + Amazon

This version is built specifically around the two supplied datasets:
- `data/raw/Online Retail.xlsx`
- `data/raw/Amazon.csv`

### Milestone 2 implemented
1. Price prediction model
2. Optimal price recommendation
3. Price-demand forecasting
4. Demand forecasting
5. 7d / 14d / 30d / 3m / 6m / 12m horizons
6. Increasing / Stable / Decreasing trend
7. Confidence score
8. MAE / RMSE
9. Separate EDA for both datasets
10. FastAPI dashboard with KPI cards and charts

### Important data reality
The two datasets have different schemas. The pipeline normalizes each into a common daily product schema, while retaining a `dataset` field so their origin is not lost.

Online Retail provides transaction date, quantity, unit price, product and country.
Amazon provides order date, quantity, unit price, discount, tax, shipping, category, brand, order status, geography and seller information.

The standard Online Retail dataset does not contain a ground-truth "optimal price", so the recommended price is produced by a constrained local price-demand elasticity simulation rather than pretending a historical price is an optimal label.

## Setup — Windows / Python 3.12

From this project root:

```powershell
py -3.12 -m venv venv
.\venv\Scripts\activate
python -m pip install -r backend\requirements.txt
```

## Run the complete real-data pipeline

```powershell
python -m backend.app.ml.prepare_data
python -m backend.app.ml.EDA_Online_Retail
python -m backend.app.ml.EDA_Amazon
python -m backend.app.ml.train_all
uvicorn backend.app.main:app --reload
```

Then open:
`http://127.0.0.1:8000/`

API docs:
`http://127.0.0.1:8000/docs`

### Output folders
- Cleaned data: `data/processed/`
- EDA charts: `data/eda_outputs/online_retail/` and `data/eda_outputs/amazon/`
- Trained models: `models/`
