"""
PricePilot AI — Milestone 2
Pytest Test Suite for ML Prediction & Groq Insight Endpoints
=============================================================
Tests:
  - GET  /v2/models/info                → model metadata
  - POST /v2/predict/price              → price prediction
  - POST /v2/predict/demand             → demand prediction
  - POST /v2/insight/demand             → Groq demand insight (mock)
  - POST /v2/insight/optimize           → Groq optimize insight (mock)
  - POST /v2/insight/competitor         → Groq competitor insight (mock)
  - POST /v2/insight/seasonal           → Groq seasonal insight (mock)
"""

import pytest
from fastapi.testclient import TestClient
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.main import app

client = TestClient(app)

# ─── Helper: Auth Token ───────────────────────────────────────────────────────
def get_token():
    r = client.post("/auth/login", data={"username": "admin@pricepilot.ai", "password": "Admin@123"})
    if r.status_code == 200:
        return r.json().get("access_token")
    # If seeded with default admin
    r2 = client.post("/auth/token", json={"email": "admin@pricepilot.ai", "password": "Admin@123"})
    return r2.json().get("access_token", "")

TOKEN = None

@pytest.fixture(scope="module", autouse=True)
def auth_header():
    global TOKEN
    TOKEN = get_token()


def headers():
    return {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}


# ─── Tests: Model Metadata ────────────────────────────────────────────────────

class TestModelInfo:
    def test_model_info_returns_200(self):
        r = client.get("/v2/models/info")
        assert r.status_code == 200

    def test_model_info_has_keys(self):
        r = client.get("/v2/models/info")
        body = r.json()
        assert "price_model"  in body
        assert "demand_model" in body
        assert "name" in body["price_model"]
        assert "name" in body["demand_model"]


# ─── Tests: Price Prediction ──────────────────────────────────────────────────

class TestPricePrediction:
    PAYLOAD = {
        "cost_price":   110.0,
        "base_price":   199.99,
        "comp_1_price": 187.64,
        "comp_2_price": 184.78,
        "comp_3_price": 202.65,
        "category":     "Electronics",
        "sales_channel":"Direct Web",
        "stock_level":  100,
        "rating":       4.6,
        "units_sold":   38.0,
        "is_promotion": 0,
        "is_holiday":   0,
        "month":        6,
        "quarter":      2,
        "is_weekend":   0,
    }

    def test_price_prediction_success(self):
        r = client.post("/v2/predict/price", json=self.PAYLOAD, headers=headers())
        # 200 if model loaded, 503 if model not yet trained
        assert r.status_code in (200, 503)

    def test_price_prediction_structure(self):
        r = client.post("/v2/predict/price", json=self.PAYLOAD, headers=headers())
        if r.status_code == 200:
            body = r.json()
            assert "predicted_price" in body
            assert "model_used" in body
            assert body["predicted_price"] > 0

    def test_price_prediction_invalid_cost(self):
        bad = {**self.PAYLOAD, "cost_price": -5.0}
        r = client.post("/v2/predict/price", json=bad, headers=headers())
        assert r.status_code == 422


# ─── Tests: Demand Prediction ─────────────────────────────────────────────────

class TestDemandPrediction:
    PAYLOAD = {
        "current_price":  171.79,
        "cost_price":     110.0,
        "base_price":     199.99,
        "comp_1_price":   187.64,
        "comp_2_price":   184.78,
        "comp_3_price":   202.65,
        "category":       "Electronics",
        "sales_channel":  "Direct Web",
        "stock_level":    100,
        "rating":         4.6,
        "is_promotion":   0,
        "is_holiday":     0,
        "month":          6,
        "quarter":        2,
        "day_of_week":    2,
        "is_weekend":     0,
    }

    def test_demand_prediction_success(self):
        r = client.post("/v2/predict/demand", json=self.PAYLOAD, headers=headers())
        assert r.status_code in (200, 503)

    def test_demand_prediction_structure(self):
        r = client.post("/v2/predict/demand", json=self.PAYLOAD, headers=headers())
        if r.status_code == 200:
            body = r.json()
            assert "predicted_demand_units" in body
            assert "predicted_revenue" in body
            assert body["predicted_demand_units"] >= 0


# ─── Tests: Groq Insight Endpoints (Mock Mode) ───────────────────────────────

class TestGroqInsights:
    def test_demand_insight_returns_200(self):
        payload = {
            "product_name":     "Aura Pro Wireless ANC Headphones",
            "category":         "Electronics",
            "current_price":    171.79,
            "predicted_demand": 38.0,
            "comp_avg_price":   191.69,
            "margin_pct":       0.36,
            "is_promotion":     False,
            "is_holiday":       False,
        }
        r = client.post("/v2/insight/demand", json=payload, headers=headers())
        assert r.status_code == 200
        body = r.json()
        assert "insight" in body or "product" in body

    def test_optimize_insight_returns_200(self):
        payload = {
            "product_name":     "Aura Pro Wireless ANC Headphones",
            "category":         "Electronics",
            "cost_price":       110.0,
            "current_price":    171.79,
            "min_price":        126.50,
            "max_price":        259.99,
            "comp_prices":      {"Amazon": 187.64, "Walmart": 184.78, "Target": 202.65},
            "elasticity":       -1.85,
            "predicted_demand": 38.0,
        }
        r = client.post("/v2/insight/optimize", json=payload, headers=headers())
        assert r.status_code == 200
        body = r.json()
        assert "optimization_report" in body

    def test_competitor_insight_returns_200(self):
        payload = {
            "product_name": "Aura Pro Wireless ANC Headphones",
            "our_price":    171.79,
            "comp_1":       187.64,
            "comp_2":       184.78,
            "comp_3":       202.65,
            "our_margin":   0.36,
        }
        r = client.post("/v2/insight/competitor", json=payload, headers=headers())
        assert r.status_code == 200
        body = r.json()
        assert "competitive_report" in body

    def test_seasonal_insight_returns_200(self):
        payload = {
            "category":                "Electronics",
            "month":                   11,
            "avg_demand":              42.0,
            "promo_demand_lift_pct":   137.3,
            "holiday_demand_lift_pct": 275.5,
            "top_products":            ["Aura Pro Wireless ANC Headphones", "UltraView 27\" Gaming Monitor"],
        }
        r = client.post("/v2/insight/seasonal", json=payload, headers=headers())
        assert r.status_code == 200
        body = r.json()
        assert "seasonal_analysis" in body
