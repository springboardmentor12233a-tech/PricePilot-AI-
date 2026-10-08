"""
Exploratory Data Analysis (EDA) visualizations and portfolio distribution test suite for PricePilot AI.
"""

from fastapi.testclient import TestClient


def test_eda_data_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/eda/data returns 200 with category breakdowns and price elasticity curves."""
    res = client.get("/api/eda/data", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    for key in ("category_revenue", "price_gap_histogram", "price_vs_quantity_scatter"):
        assert key in data, f"Missing key '{key}' in EDA payload"
    assert len(data["category_revenue"]) > 0
    assert len(data["price_vs_quantity_scatter"]) > 0


def test_eda_data_without_token_returns_401(client: TestClient):
    """Checks that GET /api/eda/data without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/eda/data")
    assert res.status_code == 401


def test_eda_nonexistent_endpoint_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/eda/prod_999 returns 404 Not Found instead of 500."""
    res = client.get("/api/eda/prod_999", headers=analyst_headers)
    assert res.status_code == 404
