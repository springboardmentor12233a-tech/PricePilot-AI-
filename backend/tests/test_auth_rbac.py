"""
PricePilot AI — Authentication & RBAC Test Suite
=================================================
Tests:
1. Correct Admin login
2. Correct Analyst login
3. Correct User login
4. Incorrect password
5. Unknown email
6. Inactive user handling
7. Valid JWT verification
8. Invalid JWT
9. Expired JWT
10. Admin accessing /api/users
11. Analyst denied from /api/users
12. User denied from /api/users
13. Admin creating user
14. Analyst denied from creating user
15. Duplicate email rejection
16. Password is hashed upon user creation
17. password_hash never exposed in any responses
18. Safeguard against deleting the only active admin
"""

from datetime import datetime, timedelta, timezone
import pytest
from starlette.testclient import TestClient
from jose import jwt

from backend.app.auth import create_access_token
from backend.app.config import settings
from backend.app.database import users_collection
from backend.app.security import hash_password, verify_password


@pytest.fixture(autouse=True)
def ensure_default_users():
    """Ensure baseline test accounts exist in MongoDB with properly hashed passwords."""
    admin = users_collection.find_one({"email": "admin@pricepilot.demo"})
    if not admin:
        users_collection.insert_one({
            "name": "Admin",
            "email": "admin@pricepilot.demo",
            "role": "ADMIN",
            "password_hash": hash_password("Admin@123"),
            "is_active": True,
            "department": "Pricing Strategy & Platform Ops",
        })
    elif not admin.get("password_hash") or not verify_password("Admin@123", admin.get("password_hash")):
        users_collection.update_one(
            {"_id": admin["_id"]},
            {"$set": {"password_hash": hash_password("Admin@123"), "is_active": True}}
        )

    analyst = users_collection.find_one({"email": "analyst@pricepilot.demo"})
    if not analyst:
        users_collection.insert_one({
            "name": "Business Analyst",
            "email": "analyst@pricepilot.demo",
            "role": "BUSINESS_ANALYST",
            "password_hash": hash_password("Analyst@123"),
            "is_active": True,
            "department": "Merchandising & Pricing",
        })
    elif not analyst.get("password_hash") or not verify_password("Analyst@123", analyst.get("password_hash")):
        users_collection.update_one(
            {"_id": analyst["_id"]},
            {"$set": {"password_hash": hash_password("Analyst@123"), "is_active": True}}
        )

    user = users_collection.find_one({"email": "user@pricepilot.demo"})
    if not user:
        users_collection.insert_one({
            "name": "Standard User",
            "email": "user@pricepilot.demo",
            "role": "USER",
            "password_hash": hash_password("User@123"),
            "is_active": True,
            "department": "Store Merchandising",
        })
    elif not user.get("password_hash") or not verify_password("User@123", user.get("password_hash")):
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_hash": hash_password("User@123"), "is_active": True}}
        )


def test_admin_login(client: TestClient):
    """1. Correct Admin login returns token & ADMIN role."""
    resp = client.post("/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@pricepilot.demo"
    assert data["user"]["role"] == "ADMIN"
    assert "password_hash" not in data["user"]
    assert "password" not in data["user"]


def test_analyst_login(client: TestClient):
    """2. Correct Analyst login returns token & BUSINESS_ANALYST role."""
    resp = client.post("/api/auth/login", json={"email": "analyst@pricepilot.demo", "password": "Analyst@123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "BUSINESS_ANALYST"
    assert "password_hash" not in data["user"]


def test_user_login(client: TestClient):
    """3. Correct User login returns token & USER role."""
    resp = client.post("/api/auth/login", json={"email": "user@pricepilot.demo", "password": "User@123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "USER"
    assert "password_hash" not in data["user"]


def test_incorrect_password(client: TestClient):
    """4. Incorrect password returns 401 Unauthorized."""
    resp = client.post("/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "WrongPassword!"})
    assert resp.status_code == 401
    assert "detail" in resp.json()


def test_unknown_email(client: TestClient):
    """5. Unknown email returns safe 401 error."""
    resp = client.post("/api/auth/login", json={"email": "nonexistent@enterprise.com", "password": "Password123!"})
    assert resp.status_code == 401
    assert "Invalid" in resp.json()["detail"]


def test_inactive_user_login(client: TestClient):
    """6. Inactive user login returns 403 Forbidden."""
    # Create temporary inactive user
    test_email = "inactive.test@pricepilot.demo"
    users_collection.delete_many({"email": test_email})
    users_collection.insert_one({
        "name": "Inactive User",
        "email": test_email,
        "role": "USER",
        "password_hash": hash_password("Pass@123"),
        "is_active": False,
    })

    try:
        resp = client.post("/api/auth/login", json={"email": test_email, "password": "Pass@123"})
        assert resp.status_code == 403
        assert "deactivated" in resp.json()["detail"].lower()
    finally:
        users_collection.delete_many({"email": test_email})


def test_valid_jwt_and_me_endpoint(client: TestClient):
    """7. Valid JWT allows access to /api/auth/me."""
    login_resp = client.post("/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"})
    token = login_resp.json()["access_token"]

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@pricepilot.demo"
    assert data["role"] == "ADMIN"
    assert "password_hash" not in data


def test_admin_can_access_me_endpoint(client: TestClient):
    """ADMIN retains access to identity/session endpoints."""
    login_resp = client.post("/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"})
    token = login_resp.json()["access_token"]

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "ADMIN"


def test_admin_denied_business_apis(client: TestClient):
    """ADMIN is restricted to governance and cannot call business APIs."""
    login_resp = client.post("/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        "/api/dashboard/summary",
        "/api/pricing?item_id=293375605257&store_id=1",
        "/api/demand?item_id=293375605257&store_id=1",
        "/api/revenue?item_id=293375605257&store_id=1",
        "/api/competitor?item_id=293375605257&store_id=1",
        "/api/insights?item_id=293375605257&store_id=1",
    ]

    for endpoint in endpoints:
        assert client.get(endpoint, headers=headers).status_code == 403


def test_user_can_access_business_api(client: TestClient):
    """USER retains access to the business APIs."""
    login_resp = client.post("/api/auth/login", json={"email": "user@pricepilot.demo", "password": "User@123"})
    token = login_resp.json()["access_token"]

    resp = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def test_invalid_jwt(client: TestClient):
    """8. Invalid JWT signature/token returns 401."""
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token_abc123"})
    assert resp.status_code == 401


def test_expired_jwt(client: TestClient):
    """9. Expired JWT returns 401."""
    expired_payload = {
        "sub": "admin@pricepilot.demo",
        "role": "ADMIN",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


def test_admin_access_users(client: TestClient):
    """10. Admin can access GET /api/users."""
    login_resp = client.post("/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"})
    token = login_resp.json()["access_token"]

    resp = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 3
    for u in users:
        assert "password_hash" not in u
        assert "password" not in u


def test_analyst_denied_users(client: TestClient):
    """11. Business Analyst is denied from GET /api/users (403 Forbidden)."""
    login_resp = client.post("/api/auth/login", json={"email": "analyst@pricepilot.demo", "password": "Analyst@123"})
    token = login_resp.json()["access_token"]

    resp = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_user_denied_users(client: TestClient):
    """12. Standard User is denied from GET /api/users (403 Forbidden)."""
    login_resp = client.post("/api/auth/login", json={"email": "user@pricepilot.demo", "password": "User@123"})
    token = login_resp.json()["access_token"]

    resp = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_admin_creating_user_and_hashing(client: TestClient):
    """13, 16, 17. Admin creating user stores password_hash, never plaintext, not exposed."""
    admin_token = client.post(
        "/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"}
    ).json()["access_token"]

    new_email = "new.staff@pricepilot.demo"
    users_collection.delete_many({"email": new_email})

    try:
        resp = client.post(
            "/api/users",
            json={
                "name": "New Staff Member",
                "email": new_email,
                "password": "SecurePassword123!",
                "role": "USER",
                "department": "Pricing Analytics",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        created = resp.json()
        assert created["email"] == new_email
        assert created["role"] == "USER"
        assert "password_hash" not in created
        assert "password" not in created

        # Check in MongoDB directly: password must be hashed, plaintext must NOT exist
        doc = users_collection.find_one({"email": new_email})
        assert doc is not None
        assert "password_hash" in doc
        assert doc["password_hash"].startswith("$2b$")
        assert "password" not in doc
        assert verify_password("SecurePassword123!", doc["password_hash"]) is True

        # Check that newly created user can log in
        login_test = client.post(
            "/api/auth/login",
            json={"email": new_email, "password": "SecurePassword123!"},
        )
        assert login_test.status_code == 200
        assert "access_token" in login_test.json()

    finally:
        users_collection.delete_many({"email": new_email})


def test_analyst_denied_creating_user(client: TestClient):
    """14. Analyst is denied from creating users."""
    analyst_token = client.post(
        "/api/auth/login", json={"email": "analyst@pricepilot.demo", "password": "Analyst@123"}
    ).json()["access_token"]

    resp = client.post(
        "/api/users",
        json={
            "name": "Hacked User",
            "email": "hacked@test.com",
            "password": "Password123!",
            "role": "ADMIN",
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 403


def test_duplicate_email_rejected(client: TestClient):
    """15. Duplicate email registration or creation is rejected with 400 Bad Request."""
    admin_token = client.post(
        "/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"}
    ).json()["access_token"]

    resp = client.post(
        "/api/users",
        json={
            "name": "Duplicate Admin",
            "email": "admin@pricepilot.demo",
            "password": "Password123!",
            "role": "USER",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]


def test_admin_safeguard_single_admin(client: TestClient):
    """18. Cannot delete or deactivate the only active administrator."""
    admin_token = client.post(
        "/api/auth/login", json={"email": "admin@pricepilot.demo", "password": "Admin@123"}
    ).json()["access_token"]

    admin_doc = users_collection.find_one({"email": "admin@pricepilot.demo"})
    admin_id = str(admin_doc["_id"])

    # Attempt to deactivate admin
    deact_resp = client.patch(
        f"/api/users/{admin_id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert deact_resp.status_code == 400
    assert "only active administrator" in deact_resp.json()["detail"]

    # Attempt to delete admin
    del_resp = client.delete(
        f"/api/users/{admin_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 400
    assert "only active administrator" in del_resp.json()["detail"]
