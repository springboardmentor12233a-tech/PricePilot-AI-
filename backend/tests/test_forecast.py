"""
Demand forecasting and horizon simulation test suite for PricePilot AI.
"""

from fastapi.testclient import TestClient


def test_forecast_product_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/forecast/{product_id} returns 200 with forecast projections and historicals."""
    res = client.get("/api/forecast/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["product_id"] == "prod_001"
    for field in ("product_name", "horizon_days", "history", "forecast", "confidence_score"):
        assert field in data, f"Missing field '{field}' in forecast response"


def test_forecast_confidence_score_between_0_and_100(client: TestClient, analyst_headers: dict):
    """Verifies that the forecast confidence score for a known product is between 0 and 100."""
    res = client.get("/api/forecast/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    confidence = data["confidence_score"]
    assert isinstance(confidence, (int, float))
    assert 0.0 <= confidence <= 100.0, f"Confidence score {confidence} is out of [0, 100] bounds"


def test_forecast_horizon_toggling(client: TestClient, analyst_headers: dict):
    """Checks that the forecast endpoint respects horizon toggling for 7d and 30d periods."""
    res_7d = client.get("/api/forecast/prod_001?horizon=7d", headers=analyst_headers)
    assert res_7d.status_code == 200
    assert res_7d.json()["horizon_days"] == 7

    res_30d = client.get("/api/forecast/prod_001?horizon=30d", headers=analyst_headers)
    assert res_30d.status_code == 200
    assert res_30d.json()["horizon_days"] == 30


def test_forecast_all_products_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/forecast/all returns 200 with projections for all portfolio SKUs."""
    res = client.get("/api/forecast/all", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 8


def test_forecast_without_token_returns_401(client: TestClient):
    """Checks that GET /api/forecast/prod_001 without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/forecast/prod_001")
    assert res.status_code == 401


def test_forecast_all_without_token_returns_401(client: TestClient):
    """Checks that GET /api/forecast/all without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/forecast/all")
    assert res.status_code == 401


def test_forecast_nonexistent_product_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/forecast/prod_999 returns 404 Not Found instead of 500."""
    res = client.get("/api/forecast/prod_999", headers=analyst_headers)
    assert res.status_code == 404
