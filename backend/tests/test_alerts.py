"""
Test Suite: Enterprise Alerts Endpoint
======================================
Verifies real-time heuristic radar, RBAC permissions, schema correctness,
and accurate SKU/store alert generation from real dataset records.
"""

def test_alerts_success_business_analyst(client, analyst_headers):
    response = client.get("/api/alerts", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "total" in data
    assert data["total"] > 0
    assert len(data["alerts"]) > 0
    assert data["source"] == "LIVE_RADAR_SERVICE"
    assert data["_dataSource"] == "LIVE_API"
    assert data["_isMock"] is False

    # Inspect first alert item
    first = data["alerts"][0]
    assert "id" in first
    assert "type" in first
    assert "category" in first
    assert first["category"] in ("Demand", "Pricing", "Revenue", "Market", "AI")
    assert first["severity"] in ("HIGH", "MEDIUM", "LOW", "CRITICAL")
    assert "title" in first
    assert "message" in first
    assert "productId" in first
    assert "productName" in first
    assert "recommendedAction" in first
    assert "explanation" in first


def test_alerts_success_user_role(client, user_headers):
    response = client.get("/api/alerts", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert len(data["alerts"]) > 0


def test_alerts_rbac_admin_blocked(client, admin_headers):
    response = client.get("/api/alerts", headers=admin_headers)
    assert response.status_code == 403


def test_alerts_unauthenticated(client):
    response = client.get("/api/alerts")
    assert response.status_code == 401


def test_alerts_store_filtering(client, analyst_headers):
    response = client.get("/api/alerts?store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for alert in data["alerts"]:
        assert alert["store_id"] == 1


def test_alerts_category_filtering(client, analyst_headers):
    response = client.get("/api/alerts?category=Demand", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    for alert in data["alerts"]:
        assert alert["category"] == "Demand"


def test_alerts_contain_real_sku(client, analyst_headers):
    response = client.get("/api/alerts", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    skus = [a["productId"] for a in data["alerts"]]
    assert len(skus) > 0
    # Ensure real SKU format (e.g. 12 character hex string from dataset like 0022b986c8f0)
    for sku in skus:
        assert len(sku) >= 6
        assert not sku.startswith("MOCK_")
