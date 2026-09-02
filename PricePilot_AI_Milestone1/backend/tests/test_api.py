import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data

def test_auth_login_and_token():
    # Login with seeded pricing manager account
    response = client.post("/api/auth/login", json={
        "email": "manager@pricepilot.ai",
        "password": "Manager@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "pricing_manager"

def test_auth_me_endpoint():
    # Login first
    login_res = client.post("/api/auth/login", json={
        "email": "manager@pricepilot.ai",
        "password": "Manager@123"
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    user = response.json()
    assert user["email"] == "manager@pricepilot.ai"

def test_products_list():
    login_res = client.post("/api/auth/login", json={
        "email": "manager@pricepilot.ai",
        "password": "Manager@123"
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    assert "sku" in products[0]
    assert "current_price" in products[0]
    assert "margin_pct" in products[0]

def test_product_price_update_and_guardrails():
    login_res = client.post("/api/auth/login", json={
        "email": "manager@pricepilot.ai",
        "password": "Manager@123"
    })
    token = login_res.json()["access_token"]

    # 1. Get first product
    prod_res = client.get("/api/products", headers={"Authorization": f"Bearer {token}"})
    product = prod_res.json()[0]
    prod_id = product["id"]
    valid_new_price = round((product["min_price"] + product["max_price"]) / 2.0, 2)

    # 2. Test successful price update
    update_res = client.post(
        f"/api/products/{prod_id}/price",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_price": valid_new_price, "change_reason": "Automated Test Optimization"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["current_price"] == valid_new_price

    # 3. Test Guardrail Min Violation
    invalid_low = product["min_price"] - 10.0
    low_res = client.post(
        f"/api/products/{prod_id}/price",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_price": invalid_low, "change_reason": "Test Low"}
    )
    assert low_res.status_code == 400
    assert "below allowed minimum" in low_res.json()["detail"].lower() or "price violation" in low_res.json()["detail"].lower()

    # 4. Test Guardrail Max Violation
    invalid_high = product["max_price"] + 50.0
    high_res = client.post(
        f"/api/products/{prod_id}/price",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_price": invalid_high, "change_reason": "Test High"}
    )
    assert high_res.status_code == 400
    assert "exceeds allowed maximum" in high_res.json()["detail"].lower() or "price violation" in high_res.json()["detail"].lower()

def test_analytics_kpis():
    login_res = client.post("/api/auth/login", json={
        "email": "analyst@pricepilot.ai",
        "password": "Analyst@123"
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/analytics/kpis", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    kpis = response.json()
    assert kpis["total_products"] > 0
    assert kpis["total_revenue"] > 0
    assert kpis["avg_profit_margin_pct"] > 0

def test_datasets_summary():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@pricepilot.ai",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/datasets/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    summary = response.json()
    assert summary["status"] == "healthy"
    assert len(summary["datasets"]) >= 4
