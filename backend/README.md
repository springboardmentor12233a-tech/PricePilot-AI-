# PricePilot AI — FastAPI Backend Foundation

## 1. Overview & Architecture

The PricePilot AI Backend provides a RESTful API layer connecting the core machine learning models, revenue optimization engine, competitor/market analysis engine, and commercial KPIs to modern frontend interfaces (e.g., React, Next.js).

```
Frontend (React / Next.js)
         ↓
   FastAPI REST API
         ↓
    Service Layer
         ↓
PricePilot ML & Business Engines
 (Price, Demand, Revenue, Competitor, KPIs, Gemini)
         ↓
  Models & Serialized Artifacts
```

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entrypoint, CORS, routers
│   ├── config.py                # Environment configuration & settings
│   ├── schemas/                 # Pydantic data schemas
│   │   ├── __init__.py
│   │   └── requests.py          # Request & response data models
│   ├── services/                # Service layer invoking existing engines
│   │   ├── __init__.py
│   │   ├── price_service.py     # Price recommendation service
│   │   ├── demand_service.py    # Demand forecasting service
│   │   ├── revenue_service.py   # Revenue optimization service
│   │   ├── competitor_service.py# Competitor & market analysis service
│   │   └── insight_service.py   # Gemini business insights service
│   └── api/
│       ├── __init__.py
│       └── routes/
│           ├── __init__.py
│           ├── health.py        # GET /api/health
│           ├── pricing.py       # GET /api/pricing
│           ├── demand.py        # GET /api/demand
│           ├── revenue.py       # GET /api/revenue
│           ├── competitor.py    # GET /api/competitor
│           ├── insights.py      # GET /api/insights
│           └── dashboard.py     # GET /api/dashboard/summary
├── tests/                       # Pytest test suite
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_pricing.py
│   ├── test_demand.py
│   ├── test_revenue.py
│   ├── test_competitor.py
│   ├── test_insights.py
│   ├── test_dashboard.py
│   └── test_cors.py
├── requirements.txt             # Clean backend dependencies
└── README.md                    # This documentation file
```

---

## 3. Installation & Setup

### Prerequisites
- Python 3.9+ (Python 3.12 recommended)
- Virtual environment activated

### Install Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## 4. Starting the Backend Server

To run the FastAPI server with live reloading:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Once running, interactive documentation is available at:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 5. Available API Endpoints

### 1. `GET /api/health`
Returns service health status, application name, API version, and timestamp.

**Response Example:**
```json
{
  "status": "healthy",
  "app_name": "PricePilot AI Backend",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-09-19T19:45:00Z"
}
```

---

### 2. `GET /api/pricing`
Computes reference price, model-predicted market clearing price, and recommended price.

**Query Parameters:**
- `item_id` (str, required): Product SKU identifier.
- `store_id` (int, required): Store branch identifier (1, 2, 3, or 4).
- `date` (str, optional): Reference observation date (`YYYY-MM-DD`).

**Response Example:**
```json
{
  "item_id": "293375605257",
  "store_id": 1,
  "reference_price": 47.86,
  "predicted_clearing_price": 49.50,
  "recommended_price": 50.25,
  "price_change_pct": 5.0,
  "alignment_score": 0.985,
  "recommendation_reason": "Price adjusted to align with model equilibrium clearing price.",
  "candidates_summary": [...]
}
```

---

### 3. `GET /api/demand`
Generates multi-horizon daily demand forecasts, trend classification (`INCREASING`/`STABLE`/`DECREASING`), and confidence metrics.

**Query Parameters:**
- `item_id` (str, required): Product SKU identifier.
- `store_id` (int, required): Store branch identifier.
- `horizon` (int, optional, default=7): Forecast horizon (7, 14, or 30 days).

**Response Example:**
```json
{
  "item_id": "293375605257",
  "store_id": 1,
  "horizon": 7,
  "forecast_dates": ["2024-08-05", "2024-08-06", "2024-08-07", "2024-08-08", "2024-08-09", "2024-08-10", "2024-08-11"],
  "daily_forecasts": [
    {"date": "2024-08-05", "day_offset": 1, "predicted_quantity": 4.85},
    {"date": "2024-08-06", "day_offset": 2, "predicted_quantity": 5.10}
  ],
  "aggregate_forecast": 35.40,
  "trend_classification": "STABLE",
  "confidence_score": 85.0
}
```

---

### 4. `GET /api/revenue`
Executes expected revenue optimization by coupling demand forecasting and price models across discrete candidate price points.

**Query Parameters:**
- `item_id` (str, required): Product SKU identifier.
- `store_id` (int, required): Store branch identifier.

**Response Example:**
```json
{
  "item_id": "293375605257",
  "store_id": 1,
  "reference_price": 47.86,
  "optimal_revenue_price": 52.65,
  "optimal_expected_demand": 4.60,
  "optimal_expected_revenue": 242.19,
  "optimal_revenue_lift_pct_vs_ref": 8.4,
  "clearing_recommended_price": 49.50,
  "optimization_rationale": "Discrete search evaluated 9 candidates; price 52.65 maximizes daily expected revenue.",
  "candidates_summary": [...]
}
```

---

### 5. `GET /api/competitor`
Provides internal digital-channel parity benchmarks (`online.csv`), cross-store price dispersion, category peer medians, market position, and rule-based opportunity diagnostics.

**Query Parameters:**
- `item_id` (str, required): Product SKU identifier.
- `store_id` (int, required): Store branch identifier.

**Response Example:**
```json
{
  "item_id": "293375605257",
  "store_id": 1,
  "store_price": 47.86,
  "internal_digital_channel": {
    "has_online_listing": true,
    "online_price": 47.86,
    "channel_price_diff": 0.0,
    "channel_price_diff_pct": 0.0,
    "channel_price_index": 1.0,
    "channel_alignment_status": "CHANNEL_PARITY"
  },
  "cross_store_dispersion": {
    "store_count": 4,
    "store_min_price": 47.86,
    "store_max_price": 47.86,
    "store_median_price": 47.86,
    "store_price_range": 0.0,
    "store_price_dispersion_pct": 0.0
  },
  "category_peer_benchmark": {
    "peer_group_level": "SUBCLASS",
    "peer_median_price": 49.90,
    "peer_percentile_rank": 42.5,
    "peer_median_diff_pct": -4.1
  },
  "market_position": {
    "market_position": "Near Peer Benchmark",
    "position_tier": "MARKET_ALIGNED"
  },
  "pricing_opportunity": {
    "opportunity_signal": "ALIGNED_STABLE",
    "signal_priority": "LOW"
  },
  "external_competitor_available": false
}
```

---

### 6. `GET /api/insights`
Generates executive-ready business explanations and merchandising actions via Google Gemini LLM API with guaranteed zero-crash offline fallback.

**Query Parameters:**
- `item_id` (str, required): Product SKU identifier.
- `store_id` (int, required): Store branch identifier.

**Response Example:**
```json
{
  "item_id": "293375605257",
  "store_id": 1,
  "executive_summary": "Item reflects a stable demand profile with an upward adjustment recommended to capture margin.",
  "pricing_rationale": "Recommended price aligns with clearing equilibrium while preserving velocity.",
  "demand_and_forecast_insights": "7-day forecast projects 35.4 units with high consistency.",
  "commercial_risks": "Low risk; maintain cross-channel digital parity.",
  "actionable_recommendations": [
    "Deploy recommended price and monitor 7-day volume response.",
    "Align replenishment schedule with projected 7-day demand."
  ],
  "source_model": "gemini-2.5-flash",
  "is_live_gemini": true,
  "status": "success"
}
```

---

### 7. `GET /api/dashboard/summary`
Returns aggregate portfolio KPIs across revenue, demand, pricing, competitor positioning, and high-priority action alerts.

**Response Example:**
```json
{
  "total_evaluated_records": 25000,
  "unique_items_count": 9333,
  "unique_stores_count": 4,
  "revenue_kpis": {
    "total_realized_revenue": 21854300.0,
    "avg_daily_revenue": 12540.0,
    "revenue_per_unit": 48.50,
    "estimated_revenue_lift_potential_pct": 6.8
  },
  "demand_kpis": {
    "total_units_sold": 450500.0,
    "demand_increasing_pct": 28.4,
    "demand_stable_pct": 45.2,
    "demand_decreasing_pct": 26.4
  },
  "market_position_summary": {
    "below_peer_pct": 30.9,
    "near_peer_pct": 37.5,
    "above_peer_pct": 31.6
  },
  "opportunity_summary": {
    "headroom_review_count": 3415,
    "premium_margin_review_count": 4065,
    "channel_disparity_review_count": 130,
    "promo_depth_review_count": 1588,
    "aligned_stable_count": 15782
  },
  "high_priority_action_count": 1718,
  "status": "success"
}
```

---

## 6. Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini GenAI API Key (Optional) | `""` (runs offline fallback) |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `HOST` | Server bind host | `0.0.0.0` |
| `PORT` | Server bind port | `8000` |
| `ENVIRONMENT` | Deployment environment | `development` |

---

## 7. Running Backend Tests

Execute pytest across the backend test suite:
```bash
pytest backend/tests/
```
