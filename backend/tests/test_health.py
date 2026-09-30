"""
Test Suite: Health Endpoint
"""

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PricePilot AI Backend" in data["app_name"]
    assert data["version"] == "1.0.0"
    assert "timestamp" in data


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["docs_url"] == "/docs"
