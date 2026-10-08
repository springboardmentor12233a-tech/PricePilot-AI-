"""
User governance and RBAC administration test suite for PricePilot AI.
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


def test_list_users_happy_path(client: TestClient, admin_headers: dict):
    """Checks that GET /api/users returns 200 for Admin with full user list and key attributes."""
    res = client.get("/api/users", headers=admin_headers)
    assert res.status_code == 200, res.text
    users = res.json()
    assert isinstance(users, list)
    assert len(users) >= 2
    first = users[0]
    for field in ("id", "email", "role", "is_active"):
        assert field in first, f"Missing field '{field}' in user item"


def test_list_users_without_token_returns_401(client: TestClient):
    """Checks that GET /api/users without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/users")
    assert res.status_code == 401


def test_list_users_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/users rejects a Business Analyst token with 403 Forbidden."""
    res = client.get("/api/users", headers=analyst_headers)
    assert res.status_code == 403


def test_admin_can_change_role_analyst_gets_403(client: TestClient, admin_headers: dict, analyst_headers: dict):
    """Checks that Admin can modify a user role while an Analyst receives 403 Forbidden."""
    temp_email = f"role_target_{uuid.uuid4().hex[:8]}@pricepilot.ai"
    try:
        signup_res = client.post(
            "/api/auth/signup",
            json={"name": "Role Test User", "email": temp_email, "password": "Password123!"},
        )
        assert signup_res.status_code == 201
        target_id = signup_res.json()["user"]["id"]

        # Analyst attempts role modification -> 403
        analyst_attempt = client.patch(
            f"/api/users/{target_id}/role",
            headers=analyst_headers,
            json={"role": "admin"},
        )
        assert analyst_attempt.status_code == 403

        # Admin changes role to viewer -> 200
        admin_update = client.patch(
            f"/api/users/{target_id}/role",
            headers=admin_headers,
            json={"role": "viewer"},
        )
        assert admin_update.status_code == 200
        assert admin_update.json()["role"] == "viewer"
    finally:
        cleanup_user_by_email(temp_email)


def test_admin_cannot_demote_or_deactivate_themselves(client: TestClient, admin_headers: dict):
    """Checks that an Admin cannot demote or deactivate their own account returning 400."""
    me_res = client.get("/api/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    my_admin_id = me_res.json()["id"]

    # Attempt self-demotion -> 400
    demote_res = client.patch(
        f"/api/users/{my_admin_id}/role",
        headers=admin_headers,
        json={"role": "analyst"},
    )
    assert demote_res.status_code == 400

    # Attempt self-deactivation -> 400
    deact_res = client.patch(
        f"/api/users/{my_admin_id}/status",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert deact_res.status_code == 400


def test_deactivated_user_cannot_login(client: TestClient, admin_headers: dict):
    """Checks that a deactivated user cannot log in returning 403 until reactivated."""
    temp_email = f"deact_{uuid.uuid4().hex[:8]}@pricepilot.ai"
    pwd = "SecurePassword123!"
    try:
        signup_res = client.post(
            "/api/auth/signup",
            json={"name": "Deactivate Test", "email": temp_email, "password": pwd},
        )
        assert signup_res.status_code == 201
        target_id = signup_res.json()["user"]["id"]

        # Admin deactivates user
        deact_res = client.patch(
            f"/api/users/{target_id}/status",
            headers=admin_headers,
            json={"is_active": False},
        )
        assert deact_res.status_code == 200
        assert deact_res.json()["is_active"] is False

        # Attempt login while deactivated -> 403
        login_fail = client.post("/api/auth/login", json={"email": temp_email, "password": pwd})
        assert login_fail.status_code == 403
        assert "deactivated" in login_fail.json().get("detail", "").lower()

        # Admin reactivates user
        react_res = client.patch(
            f"/api/users/{target_id}/status",
            headers=admin_headers,
            json={"is_active": True},
        )
        assert react_res.status_code == 200
        assert react_res.json()["is_active"] is True

        # Login now succeeds -> 200
        login_success = client.post("/api/auth/login", json={"email": temp_email, "password": pwd})
        assert login_success.status_code == 200
    finally:
        cleanup_user_by_email(temp_email)


def test_update_nonexistent_user_role_returns_404(client: TestClient, admin_headers: dict):
    """Checks that PATCH /api/users/999999/role returns 404 Not Found instead of 500."""
    res = client.patch("/api/users/999999/role", headers=admin_headers, json={"role": "analyst"})
    assert res.status_code == 404


def test_update_nonexistent_user_status_returns_404(client: TestClient, admin_headers: dict):
    """Checks that PATCH /api/users/999999/status returns 404 Not Found instead of 500."""
    res = client.patch("/api/users/999999/status", headers=admin_headers, json={"is_active": False})
    assert res.status_code == 404


def test_delete_nonexistent_user_returns_404(client: TestClient, admin_headers: dict):
    """Checks that DELETE /api/users/999999 returns 404 Not Found instead of 500."""
    res = client.delete("/api/users/999999", headers=admin_headers)
    assert res.status_code == 404
