"""
Product catalog and lifecycle management test suite for PricePilot AI.
"""

import uuid
from fastapi.testclient import TestClient


def test_list_products_happy_path_returns_enriched_catalog(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/products returns 200 with catalog containing essential pricing fields."""
    res = client.get("/api/products", headers=analyst_headers)
    assert res.status_code == 200, res.text
    products = res.json()
    assert isinstance(products, list)
    assert len(products) >= 8
    first = products[0]
    for field in ("id", "name", "category", "current_price", "cost_price", "competitor_price", "recommended_price", "confidence_score"):
        assert field in first, f"Missing field '{field}' in product record"


def test_get_product_by_id_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/products/{id} returns 200 with matching SKU details."""
    res = client.get("/api/products/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["id"] == "prod_001"
    assert "Sony" in data["name"]
    assert "recommended_price" in data


def test_list_products_without_token_returns_401_unauthorized(client: TestClient):
    """Checks that GET /api/products without an authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/products")
    assert res.status_code == 401


def test_get_product_without_token_returns_401_unauthorized(client: TestClient):
    """Checks that GET /api/products/prod_001 without an authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/products/prod_001")
    assert res.status_code == 401


def test_create_product_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that POST /api/products rejects a Business Analyst token with 403 Forbidden."""
    payload = {
        "id": "prod_unauth_01",
        "name": "Unauthorized Test SKU",
        "category": "Audio",
        "current_price": 99.0,
    }
    res = client.post("/api/products", headers=analyst_headers, json=payload)
    assert res.status_code == 403


def test_update_product_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that PUT /api/products/prod_001 rejects a Business Analyst token with 403 Forbidden."""
    res = client.put("/api/products/prod_001", headers=analyst_headers, json={"current_price": 350.0})
    assert res.status_code == 403


def test_delete_product_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that DELETE /api/products/prod_001 rejects a Business Analyst token with 403 Forbidden."""
    res = client.delete("/api/products/prod_001", headers=analyst_headers)
    assert res.status_code == 403


def test_get_nonexistent_product_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/products/prod_999 returns 404 Not Found instead of 500."""
    res = client.get("/api/products/prod_999", headers=analyst_headers)
    assert res.status_code == 404


def test_update_nonexistent_product_returns_404(client: TestClient, admin_headers: dict):
    """Checks that PUT /api/products/prod_999 returns 404 Not Found."""
    res = client.put("/api/products/prod_999", headers=admin_headers, json={"current_price": 199.0})
    assert res.status_code == 404


def test_delete_nonexistent_product_returns_404(client: TestClient, admin_headers: dict):
    """Checks that DELETE /api/products/prod_999 returns 404 Not Found."""
    res = client.delete("/api/products/prod_999", headers=admin_headers)
    assert res.status_code == 404


def test_admin_product_full_crud_lifecycle(client: TestClient, admin_headers: dict):
    """Checks that an Admin can create, update, and delete a product successfully."""
    test_id = f"prod_crud_{uuid.uuid4().hex[:6]}"
    create_payload = {
        "id": test_id,
        "name": "Logitech MX Master 3S Wireless Mouse",
        "category": "Accessories",
        "current_price": 99.99,
        "cost_price": 55.00,
        "competitor_price": 94.99,
        "stock_level": 50,
        "stock_status": "In Stock",
    }
    # 1. Create
    res_create = client.post("/api/products", headers=admin_headers, json=create_payload)
    assert res_create.status_code == 201, res_create.text
    assert res_create.json()["id"] == test_id
    assert res_create.json()["name"] == create_payload["name"]

    # 2. Update
    res_update = client.put(f"/api/products/{test_id}", headers=admin_headers, json={"current_price": 89.99})
    assert res_update.status_code == 200, res_update.text
    assert res_update.json()["current_price"] == 89.99

    # 3. Delete
    res_delete = client.delete(f"/api/products/{test_id}", headers=admin_headers)
    assert res_delete.status_code == 200, res_delete.text

    # 4. Confirm deleted
    res_verify = client.get(f"/api/products/{test_id}", headers=admin_headers)
    assert res_verify.status_code == 404
