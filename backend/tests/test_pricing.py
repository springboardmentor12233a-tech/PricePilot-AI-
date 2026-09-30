"""
Test Suite: Pricing Endpoint
"""

def test_pricing_endpoint_success(client, analyst_headers):
    response = client.get("/api/pricing?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "293375605257"
    assert data["store_id"] == 1
    assert "reference_price" in data
    assert data["reference_price"] > 0
    assert "predicted_clearing_price" in data
    assert "recommended_price" in data
    assert "alignment_score" in data
    assert "recommendation_reason" in data
    assert len(data["candidates_summary"]) > 0


def test_pricing_endpoint_missing_params(client, analyst_headers):
    # Missing store_id
    response = client.get("/api/pricing?item_id=293375605257", headers=analyst_headers)
    assert response.status_code == 422


def test_pricing_endpoint_unseen_item_fallback(client, analyst_headers):
    response = client.get("/api/pricing?item_id=UNSEEN_TEST_SKU_9999&store_id=2", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "UNSEEN_TEST_SKU_9999"
    assert data["recommended_price"] > 0
