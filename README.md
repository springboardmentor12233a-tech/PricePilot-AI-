# PricePilot AI — data layer (Phase 1)

Cleans `retail_price.csv` and loads it into a normalized Postgres schema:
`products`, `monthly_metrics`, `competitor_prices`. This has been run
end-to-end against your real file — 52 products, 676 monthly rows, 2,028
competitor-price rows loaded with zero errors.

## Run it

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create the schema
psql "postgresql://postgres:postgres@localhost:5432/pricepilot" -f schema.sql

# 4. Put retail_price.csv where the script expects it, or edit RAW_CSV
#    in clean_and_load.py, then:
python3 clean_and_load.py
```

Set `DATABASE_URL` as an env var if you're pointing at a different host,
e.g. `postgresql+psycopg2://user:pass@host:5432/dbname`.

## Important things this uncovered about the real data

- **The data is monthly, not daily.** `month_year` is always the 1st of
  the month. The original spec's "next 7 / 14 days" short-term forecast
  doesn't fit this dataset — reframe as "next 1 / 3 months" instead.
- **It's small: 676 rows across 52 products, 5–20 months each.**
  Comfortably enough for a regression/tree-based model. Not enough for
  an LSTM to reliably beat a simpler baseline — reinforces cutting deep
  learning from the v1 scope.
- **Zero nulls, zero duplicates.** No missing-value strategy needed for
  this file.
- **Competitor data is real**, not mocked: `comp_1/2/3`, `ps1/2/3` (score),
  `fp1/2/3` (freight) per competitor, unpivoted here into
  `competitor_prices` (3 rows per product-month instead of 9 columns).
- **`lag_price` is already in the source data** — previous period's unit
  price, pre-engineered. Useful for elasticity/time-series features
  without extra work.
- **Two columns of unconfirmed meaning:** `volume` (kept, likely package
  volume) and `s` (kept as `s_metric`, meaning unclear from the column
  name alone — flagged in the schema comment, not silently assumed).

## Running the Application

### Backend API (FastAPI)
```bash
# Start backend server
python main.py
# API docs available at: http://127.0.0.1:8000/docs
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Dashboard available at: http://localhost:5173
```

## Testing & Quality Assurance

See the comprehensive [TESTING.md](TESTING.md) guide for architecture details.

```bash
# Run in-memory Pytest test suite (10 automated tests)
pytest test_api.py -v

# Run integration endpoint test script
python test_endpoints.py
```
