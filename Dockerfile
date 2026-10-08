FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and artifacts
COPY backend/ ./backend/
COPY pricepilot_xgb_model.pkl .
COPY pricepilot_demand_forecast_model.pkl .
COPY pricepilot_preprocessor.pkl .
COPY pricepilot_forecast_results.csv .
COPY pricepilot_competitor_report.csv .
COPY pricepilot_category_revenue_summary.csv .
COPY pricepilot_regional_market_intelligence.csv .
COPY pricepilot_category_region_strategy.csv .
COPY pricepilot_executive_kpis.csv .

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
