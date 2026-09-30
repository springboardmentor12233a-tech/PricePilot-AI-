"""
PricePilot AI — Backend Test Configuration & Fixtures
"""

import sys
from pathlib import Path
import pytest
from starlette.testclient import TestClient

# Ensure root directory is on Python path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.main import app
from backend.app.auth import create_access_token
from backend.app.database import users_collection
from backend.app.security import hash_password


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provides a shared TestClient instance for API tests."""
    return TestClient(app)


def _ensure_test_user(email: str, role: str, password: str) -> None:
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            users_collection.insert_one({
                "name": role.replace("_", " ").title(),
                "email": email,
                "role": role,
                "password_hash": hash_password(password),
                "is_active": True,
            })
    except Exception:
        pass


def _headers_for(email: str, role: str, password: str) -> dict[str, str]:
    token = create_access_token({"sub": email, "role": role})
    return {"Authorization": f"Bearer {token}"}



@pytest.fixture
def analyst_headers() -> dict[str, str]:
    return _headers_for("analyst@pricepilot.demo", "BUSINESS_ANALYST", "Analyst@123")


@pytest.fixture
def admin_headers() -> dict[str, str]:
    return _headers_for("admin@pricepilot.demo", "ADMIN", "Admin@123")


@pytest.fixture
def user_headers() -> dict[str, str]:
    return _headers_for("user@pricepilot.demo", "USER", "User@123")
