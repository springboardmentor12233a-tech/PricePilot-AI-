"""
Test Suite: Demand Endpoint
"""

def test_demand_forecast_7d(client, analyst_headers):
    response = client.get("/api/demand?item_id=293375605257&store_id=1&horizon=7", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "293375605257"
    assert data["store_id"] == 1
    assert data["horizon"] == 7
    assert len(data["forecast_dates"]) == 7
    assert len(data["daily_forecasts"]) == 7
    assert data["aggregate_forecast"] >= 0.0
    assert data["trend_classification"] in ["INCREASING", "STABLE", "DECREASING"]
    assert "confidence_score" in data
    assert 0 <= data["confidence_score"] <= 100


def test_demand_forecast_14d(client, analyst_headers):
    response = client.get("/api/demand?item_id=293375605257&store_id=1&horizon=14", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["horizon"] == 14
    assert len(data["forecast_dates"]) == 14


def test_demand_forecast_30d(client, analyst_headers):
    response = client.get("/api/demand?item_id=293375605257&store_id=1&horizon=30", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["horizon"] == 30
    assert len(data["forecast_dates"]) == 30


def test_demand_endpoint_missing_params(client, analyst_headers):
    response = client.get("/api/demand?store_id=1", headers=analyst_headers)
    assert response.status_code == 422
