"""
Pytest configuration and session-wide fixtures for PricePilot AI backend.
Provides TestClient, cached authentication tokens, and headers for Admin and Analyst.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth import init_db_and_seed_users
from app.ml.model_registry import registry


@pytest.fixture(scope="session")
def client():
    """
    Session-wide FastAPI TestClient initialized with seeded users and loaded ML model.
    """
    init_db_and_seed_users()
    registry.load()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_token(client: TestClient) -> str:
    """
    Cached JWT token for seeded Admin user (admin@pricepilot.ai / Admin@123).
    """
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@pricepilot.ai", "password": "Admin@123"},
    )
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    token = res.json().get("access_token")
    assert token, "No access_token returned for admin login"
    return token


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> dict:
    """
    Authorization headers containing the cached Admin JWT token.
    """
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def analyst_token(client: TestClient) -> str:
    """
    Cached JWT token for seeded Business Analyst user (analyst@pricepilot.ai / Analyst@123).
    """
    res = client.post(
        "/api/auth/login",
        json={"email": "analyst@pricepilot.ai", "password": "Analyst@123"},
    )
    assert res.status_code == 200, f"Analyst login failed: {res.text}"
    token = res.json().get("access_token")
    assert token, "No access_token returned for analyst login"
    return token


@pytest.fixture(scope="session")
def analyst_headers(analyst_token: str) -> dict:
    """
    Authorization headers containing the cached Business Analyst JWT token.
    """
    return {"Authorization": f"Bearer {analyst_token}"}
