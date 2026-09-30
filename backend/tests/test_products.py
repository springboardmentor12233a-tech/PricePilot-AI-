"""
Test Suite: Product Catalog Endpoint
"""

def test_products_endpoint_success(client, analyst_headers):
    response = client.get("/api/products", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "sku" in first
    assert "name" in first
    assert "category" in first
    assert "storeId" in first
    assert "currentPrice" in first
    assert "recommendedPrice" in first
    assert "predictedPrice" in first
    assert "unitsSold" in first
    assert "revenue" in first
    assert "avgDemand" in first
    assert "forecastDemand" in first
    assert "forecastConfidence" in first
    assert "demandTrend" in first
    assert "revenueOpportunity" in first
    assert "priority" in first
    assert "marketPosition" in first
    assert "channelParityStatus" in first


def test_products_endpoint_filter_store(client, analyst_headers):
    response = client.get("/api/products?store_id=1&limit=10", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 10
    for item in data:
        assert item["storeId"] == 1


def test_products_endpoint_sku_detail(client, analyst_headers):
    response = client.get("/api/products/293375605257?store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == "293375605257"
    assert data["storeId"] == 1
    assert data["currentPrice"] > 0
