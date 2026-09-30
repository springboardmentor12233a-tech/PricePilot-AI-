"""
Test Suite: Exploratory Data Analytics (EDA) Endpoint
=====================================================
Verifies real-time EDA distributions, category and store aggregations,
Pearson correlation matrix, RBAC restrictions, and schema validity.
"""

def test_analytics_eda_success_business_analyst(client, analyst_headers):
    response = client.get("/api/analytics/eda", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()

    assert "total_records" in data
    assert data["total_records"] >= 10000
    assert data["source"] == "EDA_MODEL_ARTIFACTS"
    assert data["_dataSource"] == "LIVE_API"
    assert data["_isMock"] is False

    # 1. Price Distribution
    assert "price_distribution" in data
    assert len(data["price_distribution"]) == 4
    for item in data["price_distribution"]:
        assert "range" in item
        assert "count" in item
        assert item["count"] > 0
        assert "color" in item

    # 2. Category Performance
    assert "category_performance" in data
    assert len(data["category_performance"]) > 0
    for item in data["category_performance"]:
        assert "category" in item
        assert "revenue" in item
        assert item["revenue"] > 0
        assert "units" in item
        assert item["units"] > 0
        assert "marginLift" in item

    # 3. Store Performance
    assert "store_performance" in data
    assert len(data["store_performance"]) == 4
    for item in data["store_performance"]:
        assert "store" in item
        assert "revenue" in item
        assert item["revenue"] > 0
        assert "units" in item
        assert item["units"] > 0
        assert "parity" in item

    # 4. Correlation Matrix
    assert "correlation_matrix" in data
    assert len(data["correlation_matrix"]) > 0
    for item in data["correlation_matrix"]:
        assert "feature" in item
        assert -1.0 <= item["vsDemand"] <= 1.0
        assert -1.0 <= item["vsRevenue"] <= 1.0
        assert -1.0 <= item["vsPromo"] <= 1.0

    # 5. Price vs Demand Scatter
    assert "price_vs_demand_scatter" in data
    assert len(data["price_vs_demand_scatter"]) > 0
    for item in data["price_vs_demand_scatter"]:
        assert "price" in item
        assert item["price"] >= 0
        assert "demand" in item
        assert item["demand"] >= 0
        assert "name" in item


def test_analytics_eda_rbac_admin_blocked(client, admin_headers):
    response = client.get("/api/analytics/eda", headers=admin_headers)
    assert response.status_code == 403


def test_analytics_eda_rbac_user_blocked(client, user_headers):
    response = client.get("/api/analytics/eda", headers=user_headers)
    assert response.status_code == 403


def test_analytics_eda_unauthenticated(client):
    response = client.get("/api/analytics/eda")
    assert response.status_code == 401
