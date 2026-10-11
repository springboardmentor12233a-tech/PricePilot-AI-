"""
PricePilot AI - API test suite (Milestone 4).

Run from the backend/ folder:
    python -m pytest -v

No live database, no network, and no GROQ key needed: the DB session is a
MagicMock and every LLM / service call is patched.

CRITICAL: ALL required env vars must be set BEFORE the first FastAPI import.
`app.core.config.settings = Settings()` is called at module import time, which
validates every field. If DATABASE_URL, SECRET_KEY, or GROQ_API_KEY are missing
the import itself fails with a Pydantic ValidationError, even in tests.
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path so `import app` resolves everywhere
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# --- Set all required config values BEFORE any app import ---
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_pricepilot.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-used-in-real-app")
os.environ.setdefault("GROQ_API_KEY", "test-key-never-used")
# GROQ_API_KEY is now Optional[str] (see config.py fix), but kept here for
# environments that haven't applied that patch yet.

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.api.routes.auth import get_current_user

FAKE_USER = SimpleNamespace(
    id=1, email="manager@pricepilot.ai", full_name="Test Manager", role="pricing_manager"
)

SAMPLE_REPORT = {
    "generated_at": "2026-10-08 10:00",
    "kpis": [{"metric": "Products analyzed", "value": 2}],
    "optimization": [
        {
            "product": "Product A",
            "current_price": 100.0,
            "recommended_price": 108.0,
            "price_change_pct": 8.0,
            "revenue_uplift_pct": 5.2,
            "elasticity": -1.1,
            "elasticity_type": "elastic",
        }
    ],
    "competitors": [
        {
            "product": "Product A",
            "current_price": 100.0,
            "competitor_avg": 104.0,
            "price_gap_pct": -3.8,
            "positioning": "underpriced",
        }
    ],
    "demand": [{"product": "Product A", "demand_trend": "increasing", "forecast_confidence": 88}],
}


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def client(mock_db):
    """Logged-in client: DB and auth are overridden."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def anon_client(mock_db):
    """Client with NO auth override, to prove protected routes reject anonymous calls."""
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# --------------------------------------------------------------- health / auth
def test_health_check(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_me_requires_token(anon_client):
    assert anon_client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "manager@pricepilot.ai"
    assert body["role"] == "pricing_manager"


# --------------------------------------------------------------- price prediction
def test_price_prediction_rejects_empty_payload(client):
    assert client.post("/api/pricing/predict", json={}).status_code == 422


def test_price_prediction_rejects_invalid_month(client):
    payload = {"category": "garden_tools", "freight_price": 15.5, "lag_price": 95.0, "month": 13}
    assert client.post("/api/pricing/predict", json=payload).status_code == 422


def test_price_prediction_rejects_negative_freight(client):
    payload = {
        "category": "garden_tools",
        "freight_price": -5.0,
        "lag_price": 95.0,
        "month": 6,
    }
    assert client.post("/api/pricing/predict", json=payload).status_code == 422


def test_price_prediction_returns_503_when_model_missing(client):
    """If the ML model .pkl file doesn't exist, the endpoint should return 503, not crash."""
    with patch(
        "app.api.routes.pricing.predict_price",
        side_effect=FileNotFoundError("No trained model found"),
    ):
        r = client.post(
            "/api/pricing/predict",
            json={
                "category": "garden_tools",
                "freight_price": 15.5,
                "lag_price": 95.0,
                "qty": 12,
                "customers": 8,
                "product_score": 4.2,
                "month": 6,
            },
        )
    assert r.status_code == 503
    assert "model" in r.json()["detail"].lower()


# --------------------------------------------------------------- demand forecasting
def test_forecast_unknown_product_returns_404(client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    r = client.get("/api/forecasting/999")
    assert r.status_code == 404
    assert "not found" in r.json()["detail"].lower()


def test_forecast_products_returns_list(client, mock_db):
    """GET /api/forecasting/products should return a list (empty is fine)."""
    # Mock: distinct product_ids = empty, so products = empty list
    mock_db.query.return_value.distinct.return_value.all.return_value = []
    mock_db.query.return_value.filter.return_value.all.return_value = []
    r = client.get("/api/forecasting/products")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# --------------------------------------------------------------- competitor analysis
def test_competitor_unknown_product_returns_404(client):
    with patch("app.api.routes.competitor.get_competitor_comparison", return_value=None):
        assert client.get("/api/competitor/999").status_code == 404


def test_competitor_opportunities_empty_list(client):
    with patch("app.api.routes.competitor.detect_pricing_opportunities", return_value=[]):
        r = client.get("/api/competitor/opportunities")
    assert r.status_code == 200
    assert r.json() == []


def test_competitor_opportunities_returns_sorted_list(client):
    fake_opps = [
        {
            "product_id": 1,
            "product_name": "Widget",
            "our_price": 100.0,
            "competitor_avg": 85.0,
            "gap_pct": 17.6,
            "opportunity_type": "Overpriced",
            "recommendation": "Consider lowering price.",
        }
    ]
    with patch("app.api.routes.competitor.detect_pricing_opportunities", return_value=fake_opps):
        r = client.get("/api/competitor/opportunities")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["opportunity_type"] == "Overpriced"


# --------------------------------------------------------------- AI insights (LLM mocked)
def test_insights_requires_auth(anon_client):
    assert anon_client.get("/api/insights/1").status_code == 401


def test_insights_returns_narrative(client):
    fake = {
        "product_id": 1,
        "product_name": "Product A",
        "narrative": "Product A is priced below the competitor average.",
        "based_on": {"competitor": None, "elasticity": None, "optimization": None, "demand": None},
    }
    with patch("app.api.routes.insights.generate_pricing_insight", return_value=fake):
        r = client.get("/api/insights/1")
    assert r.status_code == 200
    assert r.json()["narrative"].startswith("Product A")


def test_insights_llm_failure_returns_503(client):
    with patch(
        "app.api.routes.insights.generate_pricing_insight",
        side_effect=RuntimeError("Groq API request failed"),
    ):
        assert client.get("/api/insights/1").status_code == 503


def test_insights_product_not_found(client):
    with patch("app.api.routes.insights.generate_pricing_insight", return_value=None):
        assert client.get("/api/insights/999").status_code == 404


# --------------------------------------------------------------- AI chatbot (LLM mocked)
def test_chat_requires_auth(anon_client):
    assert anon_client.post("/api/v1/ai/ask", json={"message": "hi"}).status_code == 401


def test_chat_returns_ai_response(client):
    with patch("app.api.routes.ai.chat_completion", return_value="Raise the price by 5%.") as llm:
        r = client.post(
            "/api/v1/ai/ask",
            json={
                "message": "Should I raise prices?",
                "history": [{"role": "assistant", "content": "Hello"}],
            },
        )
    assert r.status_code == 200
    assert r.json()["response"] == "Raise the price by 5%."

    sent = llm.call_args[0][0]
    assert sent[0]["role"] == "system"
    assert sent[-1] == {"role": "user", "content": "Should I raise prices?"}


def test_chat_grounds_answer_in_product_data(client):
    with patch("app.api.routes.ai.build_product_context", return_value="Product: Widget") as ctx, \
         patch("app.api.routes.ai.chat_completion", return_value="ok") as llm:
        r = client.post("/api/v1/ai/ask", json={"message": "Analyze it", "product_id": 7})
    assert r.status_code == 200
    ctx.assert_called_once()
    assert "Product: Widget" in llm.call_args[0][0][0]["content"]


def test_chat_unknown_product_returns_404(client):
    with patch("app.api.routes.ai.build_product_context", return_value=None):
        r = client.post("/api/v1/ai/ask", json={"message": "hi", "product_id": 999})
    assert r.status_code == 404


def test_chat_llm_failure_returns_503(client):
    with patch("app.api.routes.ai.chat_completion", side_effect=RuntimeError("Groq down")):
        r = client.post("/api/v1/ai/ask", json={"message": "hi"})
    assert r.status_code == 503


def test_chat_rejects_empty_message(client):
    assert client.post("/api/v1/ai/ask", json={"message": ""}).status_code == 422


# --------------------------------------------------------------- BI reports
def test_report_requires_auth(anon_client):
    assert anon_client.get("/api/v1/reports/download").status_code == 401


def test_report_csv_download(client):
    with patch("app.api.routes.report_export.collect_report_data", return_value=SAMPLE_REPORT):
        r = client.get("/api/v1/reports/download?format=csv&type=pricing_performance")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    assert "KEY PERFORMANCE INDICATORS" in r.text
    assert "Product A" in r.text


def test_report_html_contains_only_selected_sections(client):
    with patch("app.api.routes.report_export.collect_report_data", return_value=SAMPLE_REPORT):
        r = client.get("/api/v1/reports/download?format=html&type=competitor_benchmark")
    assert r.status_code == 200
    assert "Competitor Benchmark Report" in r.text
    assert "Competitor Analysis" in r.text
    assert "Revenue Optimization" not in r.text


def test_report_rejects_unknown_type(client):
    assert client.get("/api/v1/reports/download?type=bogus").status_code == 422


# --------------------------------------------------------------- revenue optimization
def test_revenue_elasticity_not_found(client):
    """Endpoint should 404 if product doesn't exist."""
    mock_db_local = MagicMock()
    mock_db_local.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db_local
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    with TestClient(app) as c:
        r = c.get("/api/revenue/elasticity/999")
    app.dependency_overrides.clear()
    assert r.status_code == 404


def test_revenue_optimize_not_found(client):
    """Endpoint should 404 if product doesn't exist."""
    with patch("app.api.routes.revenue.optimize_price", return_value=None):
        r = client.get("/api/revenue/optimize/999")
    assert r.status_code == 404


# --------------------------------------------------------------- dashboard
def test_dashboard_requires_auth(anon_client):
    assert anon_client.get("/api/dashboard/overview").status_code == 401


def test_dashboard_overview_structure(client):
    """Dashboard overview should return the expected top-level keys."""
    fake_overview = {
        "revenue": {
            "total_revenue": 500000.0,
            "total_units_sold": 10000,
            "average_order_value": 50.0,
            "products_tracked": 250,
        },
        "top_products": [],
        "pricing_performance": {
            "total_products_with_pricing": 100,
            "average_unit_price": 120.0,
            "products_overpriced": 10,
            "products_underpriced": 5,
            "products_competitive": 85,
        },
        "forecast_summary": {
            "products_with_forecasts": 200,
            "average_confidence_score": 82.5,
            "increasing_trend_count": 110,
            "stable_trend_count": 65,
            "decreasing_trend_count": 25,
        },
        "revenue_by_month": [{"period": "2025-01", "revenue": 45000.0}],
        "revenue_by_category": [{"category": "Electronics", "revenue": 180000.0}],
    }
    with patch("app.api.routes.dashboard.get_dashboard_overview", return_value=fake_overview):
        r = client.get("/api/dashboard/overview")
    assert r.status_code == 200
    body = r.json()
    for key in ("revenue", "top_products", "pricing_performance", "forecast_summary"):
        assert key in body, f"Missing key: {key}"
    assert body["revenue"]["total_revenue"] == 500000.0