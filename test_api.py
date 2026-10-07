import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_auth_login():
    payload = {"email": "manager@pricepilot.ai", "password": "Password123!"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_protected_route_without_token():
    # Attempting to apply price without token should return 401 or 403
    response = client.post("/products/bed1/apply-price", json={"new_price": 50.0})
    assert response.status_code in [401, 403]