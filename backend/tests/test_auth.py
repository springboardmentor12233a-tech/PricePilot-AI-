"""
Authentication and session management test suite for PricePilot AI.
"""

import uuid
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models import User


def cleanup_user_by_email(email: str):
    """Utility helper to remove temporary test users from SQLite database."""
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == email.lower().strip()).first()
        if u:
            db.delete(u)
            db.commit()
    finally:
        db.close()


def test_auth_me_happy_path_returns_user_profile(client: TestClient, admin_headers: dict):
    """Checks that GET /api/auth/me returns 200 with authenticated user profile fields."""
    res = client.get("/api/auth/me", headers=admin_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "email" in data
    assert "role" in data
    assert "id" in data
    assert data["email"] == "admin@pricepilot.ai"
    assert data["role"] == "admin"


def test_auth_me_without_token_returns_401(client: TestClient):
    """Checks that GET /api/auth/me without an authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_auth_users_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/auth/users rejects a Business Analyst token with 403 Forbidden."""
    res = client.get("/api/auth/users", headers=analyst_headers)
    assert res.status_code == 403


def test_auth_register_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that POST /api/auth/register rejects a Business Analyst token with 403 Forbidden."""
    payload = {
        "email": "unauth.register@pricepilot.ai",
        "password": "Password123!",
        "full_name": "Unauth User",
        "role": "analyst",
    }
    res = client.post("/api/auth/register", headers=analyst_headers, json=payload)
    assert res.status_code == 403


def test_auth_login_invalid_credentials_returns_401(client: TestClient):
    """Checks that POST /api/auth/login with nonexistent credentials rejects with 401 Unauthorized."""
    res = client.post(
        "/api/auth/login",
        json={"email": "nonexistent_user_999@pricepilot.ai", "password": "WrongPassword123"},
    )
    assert res.status_code == 401


def test_auth_login_seeded_admin_and_analyst_accounts(client: TestClient):
    """Checks that seeded Admin and Business Analyst accounts authenticate successfully with 200."""
    res_admin = client.post(
        "/api/auth/login",
        json={"email": "admin@pricepilot.ai", "password": "Admin@123"},
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["user"]["role"] == "admin"
    assert res_admin.json()["user"]["is_active"] is True

    res_analyst = client.post(
        "/api/auth/login",
        json={"email": "analyst@pricepilot.ai", "password": "Analyst@123"},
    )
    assert res_analyst.status_code == 200
    assert res_analyst.json()["user"]["role"] == "analyst"


def test_signup_creates_business_analyst_ignoring_admin_role_request(client: TestClient):
    """Checks that self-service signup forces analyst role even when admin is requested in body."""
    unique_email = f"throwaway_{uuid.uuid4().hex[:8]}@pricepilot.ai"
    try:
        payload = {
            "name": "Alex Mercer",
            "email": unique_email,
            "password": "SecurePassword123!",
            "role": "admin",
        }
        res = client.post("/api/auth/signup", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["role"] == "analyst"
        assert data["user"]["role"] == "analyst"
        assert data["user"]["email"] == unique_email
        assert "access_token" in data
        assert bool(data["access_token"]) is True
    finally:
        cleanup_user_by_email(unique_email)


def test_signup_duplicate_email_returns_409_conflict(client: TestClient):
    """Checks that self-service signup with an existing email returns 409 Conflict."""
    payload = {
        "name": "Admin Clone",
        "email": "ADMIN@PRICEPILOT.AI",
        "password": "Password123456",
    }
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code == 409


def test_signup_short_password_returns_400_or_422(client: TestClient):
    """Checks that signup with a short password (< 8 chars) returns 400 or 422 validation error."""
    payload = {
        "name": "Short Pass User",
        "email": f"short_{uuid.uuid4().hex[:6]}@pricepilot.ai",
        "password": "123",
    }
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code in (400, 422)


def test_signup_empty_name_or_invalid_email_returns_error(client: TestClient):
    """Checks that signup with empty name or invalid email format returns 400 or 422 error."""
    res_empty_name = client.post(
        "/api/auth/signup",
        json={"name": "   ", "email": "valid.email@pricepilot.ai", "password": "Password123!"},
    )
    assert res_empty_name.status_code in (400, 422)

    res_bad_email = client.post(
        "/api/auth/signup",
        json={"name": "Bad Email User", "email": "not-an-email-address", "password": "Password123!"},
    )
    assert res_bad_email.status_code in (400, 422)


def test_new_user_can_login_and_access_analyst_features(client: TestClient):
    """Checks that a newly registered user can log in and retrieve products with their token."""
    unique_email = f"new_analyst_{uuid.uuid4().hex[:8]}@pricepilot.ai"
    try:
        signup_res = client.post(
            "/api/auth/signup",
            json={"name": "New Analyst", "email": unique_email, "password": "SecurePassword123!"},
        )
        assert signup_res.status_code == 201

        login_res = client.post(
            "/api/auth/login",
            json={"email": unique_email, "password": "SecurePassword123!"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Analyst can view products
        prod_res = client.get("/api/products", headers=headers)
        assert prod_res.status_code == 200
    finally:
        cleanup_user_by_email(unique_email)


def test_password_reset_flow_with_token(client: TestClient):
    """Checks that forgot-password and reset-password flow completes successfully with token."""
    temp_email = f"pwd_reset_{uuid.uuid4().hex[:8]}@pricepilot.ai"
    try:
        # Create temp user
        signup_res = client.post(
            "/api/auth/signup",
            json={"name": "Reset Test User", "email": temp_email, "password": "InitialPassword1!"},
        )
        assert signup_res.status_code == 201

        # Request reset token
        forgot_res = client.post("/api/auth/forgot-password", json={"email": temp_email})
        assert forgot_res.status_code == 200
        reset_token = forgot_res.json().get("reset_token")
        assert bool(reset_token) is True

        # Reset password
        new_pwd = "UpdatedPassword99!"
        reset_res = client.post(
            "/api/auth/reset-password",
            json={"token": reset_token, "new_password": new_pwd},
        )
        assert reset_res.status_code == 200

        # Login with new password
        login_res = client.post(
            "/api/auth/login",
            json={"email": temp_email, "password": new_pwd},
        )
        assert login_res.status_code == 200
    finally:
        cleanup_user_by_email(temp_email)
