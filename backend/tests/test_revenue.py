"""
Test Suite: Revenue Endpoint
"""

def test_revenue_optimization_endpoint(client, analyst_headers):
    response = client.get("/api/revenue?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "293375605257"
    assert data["store_id"] == 1
    assert data["reference_price"] > 0
    assert data["optimal_revenue_price"] > 0
    assert data["optimal_expected_revenue"] >= 0
    assert data["clearing_recommended_price"] > 0
    assert len(data["candidates_summary"]) > 0
    assert "optimization_rationale" in data


def test_revenue_endpoint_missing_params(client, analyst_headers):
    response = client.get("/api/revenue?store_id=1", headers=analyst_headers)
    assert response.status_code == 422
