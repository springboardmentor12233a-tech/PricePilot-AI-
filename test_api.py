"""
PricePilot AI - FastAPI Test Suite (In-Memory Testing)
Tests execute against the ASGI application directly using TestClient.
No live server process or port binding required.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# --- 1. Fixtures ---

@pytest.fixture(scope="module")
def auth_token() -> str:
    """Fixture providing a valid JWT Bearer token for a pricing manager."""
    payload = {"email": "manager@pricepilot.ai", "password": "Password123!"}
    res = client.post("/auth/login", json=payload)
    assert res.status_code == 200, "Fixture failed to authenticate test user."
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token: str) -> dict:
    """Fixture providing Authorization headers with Bearer token."""
    return {"Authorization": f"Bearer {auth_token}"}


# --- 2. Public Health & System Endpoints ---

def test_health_check():
    """Verify system health endpoint and database connectivity."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


# --- 3. Authentication & RBAC Tests ---

def test_auth_login_success():
    """Verify valid credentials return JWT access token and user claims."""
    payload = {"email": "manager@pricepilot.ai", "password": "Password123!"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "pricing_manager"


def test_auth_login_invalid_credentials():
    """Verify invalid password returns 401 Unauthorized."""
    payload = {"email": "manager@pricepilot.ai", "password": "WrongPassword!"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401


def test_auth_me_with_valid_token(auth_headers: dict):
    """Verify /auth/me returns current user identity when token is supplied."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "manager@pricepilot.ai"
    assert data["role"] == "pricing_manager"


def test_protected_route_unauthorized():
    """Verify calling protected routes without Bearer token returns 401/403."""
    response = client.get("/auth/me")
    assert response.status_code in [401, 403]


# --- 4. Demand Forecasting & Elasticity Endpoints ---

def test_demand_forecast_endpoint():
    """Verify demand forecast returns multi-horizon projections and elasticity."""
    response = client.get("/forecast/demand/bed1")
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == "bed1"
    assert "horizons" in data
    assert "30_days" in data["horizons"]
    assert "elasticity" in data
    assert "type" in data["elasticity"]
    assert "revenue_simulation_curve" in data
    assert len(data["revenue_simulation_curve"]) == 13


def test_demand_forecast_custom_price_simulation():
    """Verify demand forecasting with what-if custom price query parameter."""
    response = client.get("/forecast/demand/bed1?price=45.0")
    assert response.status_code == 200
    data = response.json()
    assert data["current_price"] == 45.0


# --- 5. Competitor Intelligence & Market Stance Endpoints ---

def test_competitors_overview_endpoint():
    """Verify catalog-wide competitor intelligence summary."""
    response = client.get("/analytics/competitors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first_item = data[0]
    assert "product_id" in first_item
    assert "price_index" in first_item
    assert "market_stance" in first_item
    assert "opportunity" in first_item


def test_competitor_detail_endpoint():
    """Verify deep-dive competitor benchmarking for a specific product."""
    response = client.get("/analytics/competitors/bed1")
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == "bed1"
    assert "competitors" in data
    assert "historical_trend" in data
    assert len(data["competitors"]) > 0


# --- 6. Role-Based Action Enforcement ---

def test_apply_price_permission_unauthorized():
    """Verify applying new prices requires authentication."""
    response = client.post("/products/bed1/apply-price", json={"new_price": 50.0})
    assert response.status_code in [401, 403]