# AI-Powered Retail Business Intelligence and Sales Prediction System

A final-year AIML project combining:

- **Point 1** — ML model training (Linear Regression, Random Forest, Gradient
  Boosting + GridSearchCV) — *already completed by you in Colab.*
- **Point 2** — Domain KPI extraction, interactive charts, and a Streamlit
  dashboard — all numbers calculated directly from the 4 real datasets.
- **Point 3** — A Groq-powered AI Business Assistant that explains the
  already-calculated KPIs and ML results, and generates business reports.

Nothing in Point 2 or Point 3 invents numbers. Every KPI is a pandas
aggregation over your real CSV files; the LLM is only ever asked to
**explain** numbers it is handed, never to calculate them.

---

## 1. Project structure

```
project/
│
├── data/
│   ├── daily_operations.csv
│   ├── customer_activity.csv
│   ├── competitor_prices.csv
│   └── product_catalog.csv
│
├── models/
│   ├── best_sales_prediction_model.pkl   ← from your Point 1 Colab notebook
│   ├── model_metrics.json                ← from your Point 1 Colab notebook
│   └── README.md
│
├── src/
│   ├── __init__.py
│   ├── data_processing.py    # load + clean + merge the 4 CSVs
│   ├── kpi_engine.py         # all 24 KPIs, division-by-zero safe
│   ├── ml_prediction.py      # loads Point 1's model, exposes predict()
│   ├── groq_service.py       # Groq client, system prompt, context builder
│   └── report_generator.py   # orchestrates KPI report → Groq report
│
├── app.py                    # Streamlit dashboard (entry point)
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 2. How the architecture works

```
FOUR CSV DATASETS
      ↓
DATA PROCESSING (src/data_processing.py)
  - loads, type-cleans, merges daily_operations + product_catalog
  - builds funnel table (views/add_to_cart/purchase) from customer_activity
  - builds competitor price table
      ↓
KPI ENGINE (src/kpi_engine.py) ──────────────┐
  - filters by date/category/product/channel/brand
  - computes all 24 KPIs + growth + breakdowns    │
      ↓                                            │
ML MODEL (models/best_sales_prediction_model.pkl)  │
  - loaded once, never retrained here               │
      ↓                                              │
BEST MODEL + METRICS (mae, rmse, r2)                 │
      └──────────────────────→ BUSINESS CONTEXT (groq_service.build_business_context)
                                      ↓
                                 GROQ LLM (openai/gpt-oss-120b)
                                      ↓
                            AI INSIGHTS / REPORT (text)
                                      ↓
                            DASHBOARD (app.py, Streamlit)
```

**Why this design?** Sending raw CSVs to an LLM for every question would be
slow, expensive, and risks the LLM "calculating" wrong numbers. Instead:

1. `data_processing.py` turns 4 CSVs into 3 clean dataframes.
2. `kpi_engine.py` turns those dataframes into ~15 scalar KPIs + several
   breakdown tables — pure pandas, 100% deterministic, safe against
   division-by-zero.
3. `groq_service.build_business_context()` packs those already-calculated
   numbers into a compact JSON string (a few KB, not megabytes of CSV).
4. Groq receives that JSON + the user's question and only has to **write
   English explaining numbers it was given** — it never sees a raw row of
   data and never performs arithmetic that matters.
5. The ML model (Point 1) is loaded once and its saved MAE/RMSE/R² are
   folded into the same context, so the assistant can honestly answer
   "how accurate is the model?" using the real metrics you calculated in
   Colab — not a guess.

If the Groq API key is missing or a request fails, `groq_service.py`
catches the error and returns a clear "AI Assistant unavailable" message —
every KPI card and chart in the dashboard keeps working regardless.

---

## 3. Connecting Point 1 → Point 2 → Point 3

Your Point 1 Colab notebook already produces `best_sales_prediction_model.pkl`.
To let Point 2/3 use it (without retraining anything), add this snippet to
the **end** of your Point 1 notebook, right after you select the best model:

```python
import json, joblib

# best_model, best_model_name, mae, rmse, r2 already exist from your
# Point 1 model-comparison code — do not recompute them here.

joblib.dump(best_model, "best_sales_prediction_model.pkl")

metrics = {
    "best_model_name": best_model_name,
    "mae": float(mae),
    "rmse": float(rmse),
    "r2": float(r2),
}
with open("model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("Saved best_sales_prediction_model.pkl and model_metrics.json")
```

Download both files from Colab (folder icon → right-click → Download) and
place them inside `project/models/`.

`ml_prediction.py` reads `model.feature_names_in_` automatically (available
whenever a model was trained on a pandas DataFrame with `.fit(X, y)`), so
the "Predict Sales" tab in the dashboard can build an input form for
whatever features your model actually uses — no hardcoded feature list.

---

## 4. Running everything in Google Colab (Point 1, unchanged)

Nothing about your existing Point 1 workflow changes. Continue to:

1. Upload the 4 CSVs to Colab.
2. Run your existing merge / preprocessing / feature engineering / model
   training / GridSearchCV / model comparison code.
3. Add the snippet from Section 3 above at the end, and download the two
   resulting files into `project/models/`.

Point 2 and Point 3 (this repository) run **locally**, not in Colab, since
Streamlit dashboards aren't well suited to Colab's notebook interface.

---

## 5. Running the dashboard locally in VS Code

### Step 1 — Get the project onto your machine
Open the `project/` folder in VS Code (make sure the 4 CSVs are inside
`project/data/`, and `best_sales_prediction_model.pkl` +
`model_metrics.json` are inside `project/models/`, as described above).

### Step 2 — Create a virtual environment (recommended)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### Step 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Add your Groq API key
```bash
cp .env.example .env
```
Open `.env` in VS Code and paste your real key:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```
Get a free key at https://console.groq.com/keys. **Never commit `.env`** —
it's already in `.gitignore`.

### Step 5 — Run the dashboard
```bash
streamlit run app.py
```
This opens the dashboard at `http://localhost:8501` in your browser.

### Step 6 — Use it
- Use the sidebar filters (date, category, product, channel, brand) — every
  KPI card and chart updates accordingly.
- Section 6 has three tabs:
  - **Ask AI** — chat with the business assistant.
  - **Predict Sales** — enter feature values and get a real prediction from
    your Point 1 model.
  - **Generate Report** — produces a full 10-section business report from
    the currently filtered data.

If you don't have a Groq key yet, the dashboard still runs fully — only
the AI-powered tabs show a friendly "offline" message.

---

## 6. KPI formulas used (src/kpi_engine.py)

| KPI | Formula |
|---|---|
| Total Revenue | `sum(revenue)` from daily_operations |
| Total Cost | `sum(cost_price × units_sold)` (cost_price from product_catalog) |
| Total Profit | `Total Revenue − Total Cost` |
| Profit Margin % | `Total Profit / Total Revenue × 100` |
| Avg Selling Price | `Total Revenue / Total Units Sold` |
| Conversion Rate % | `Purchases / Views × 100` (from customer_activity event_type) |
| Stockout Rate % | `stockout_flag=True rows / total rows × 100` |
| Price Difference | `Avg Our Price (final_price) − Avg Competitor Price` |
| Revenue Growth % | `(Current Month Revenue − Previous Month Revenue) / Previous Month Revenue × 100` |
| Profit Growth % | same pattern, using profit |

All divisions go through `kpi_engine.safe_div()`, which returns `0` instead
of raising an error or producing `inf`/`NaN` when the denominator is zero
or missing — this covers empty filter selections gracefully.

---

## 7. Notes on the datasets used

- `daily_operations.csv` — daily per-product sales rows (price, discount,
  units sold, revenue, stock, competitor average price, channel, etc.) —
  the core financial table.
- `product_catalog.csv` — one row per product with `cost_price`, used to
  compute cost and profit (merged onto daily_operations by `product_id`).
- `customer_activity.csv` — event-level `view` / `add_to_cart` / `purchase`
  rows, used for the funnel and conversion-rate KPIs.
- `competitor_prices.csv` — per-competitor price history, used as a
  fallback/cross-check for competitor pricing charts.

---

## 8. Troubleshooting

- **"Required dataset not found"** → confirm all 4 CSVs are in `data/`
  with their original filenames.
- **AI Assistant shows "offline"** → check `.env` has a valid
  `GROQ_API_KEY` and that you restarted `streamlit run app.py` after
  editing `.env`.
- **"No trained model found"** → add `best_sales_prediction_model.pkl` (and
  ideally `model_metrics.json`) to `models/`.
- **Groq model errors ("model decommissioned")** → Groq periodically
  retires models. Check https://console.groq.com/docs/models and set
  `GROQ_MODEL=<new-model-id>` in `.env`.




cd /d "C:\Users\pavan\OneDrive\Documents\project"

venv\Scripts\activate

python --version

python -m pip install --upgrade pip

pip install -r requirements.txt

python -m streamlit run app.py