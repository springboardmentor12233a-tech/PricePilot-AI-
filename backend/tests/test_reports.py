"""
Test Suite: BI Reports Endpoint
"""

def test_reports_generate_success_analyst(client, analyst_headers):
    response = client.get("/api/reports/generate?item_id=0022b986c8f0&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == "0022b986c8f0"
    assert data["storeId"] == 1
    assert "reportId" in data
    assert "title" in data
    assert "executiveSummary" in data
    assert len(data["executiveSummary"]) > 0
    assert "productKpis" in data
    assert data["productKpis"]["referencePrice"] > 0
    assert data["productKpis"]["recommendedPrice"] > 0
    assert data["productKpis"]["clearingPrice"] > 0
    assert "demandForecastSummary" in data
    assert data["demandForecastSummary"]["horizon7d"] > 0
    assert data["demandForecastSummary"]["trend"] in ("INCREASING", "STABLE", "DECREASING")
    assert "revenueOptimizationSummary" in data
    assert data["revenueOptimizationSummary"]["optimalPrice"] > 0
    assert "marketBenchmarkSummary" in data
    assert data["marketBenchmarkSummary"]["channelIndex"] > 0
    assert len(data["aiRecommendations"]) > 0
    assert len(data["keyActions"]) > 0


def test_reports_generate_another_sku(client, analyst_headers):
    response = client.get("/api/reports/generate?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == "293375605257"
    assert data["productKpis"]["referencePrice"] > 0


def test_reports_missing_item_id(client, analyst_headers):
    response = client.get("/api/reports/generate", headers=analyst_headers)
    assert response.status_code == 422


def test_reports_unauthorized_no_token(client):
    response = client.get("/api/reports/generate?item_id=0022b986c8f0&store_id=1")
    assert response.status_code == 401


def test_reports_rbac_admin_blocked(client, admin_headers):
    response = client.get("/api/reports/generate?item_id=0022b986c8f0&store_id=1", headers=admin_headers)
    assert response.status_code == 403


def test_reports_rbac_user_blocked(client, user_headers):
    response = client.get("/api/reports/generate?item_id=0022b986c8f0&store_id=1", headers=user_headers)
    assert response.status_code == 403
