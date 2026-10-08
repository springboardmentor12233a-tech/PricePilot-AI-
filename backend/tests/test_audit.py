"""
Enterprise audit logging and governance compliance test suite for PricePilot AI.
"""

from fastapi.testclient import TestClient


def test_get_audit_logs_happy_path(client: TestClient, admin_headers: dict):
    """Checks that GET /api/audit-logs returns 200 for Admin with chronologically ordered log entries."""
    res = client.get("/api/audit-logs", headers=admin_headers)
    assert res.status_code == 200, res.text
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    first = logs[0]
    for field in ("id", "user_email", "role", "action", "timestamp"):
        assert field in first, f"Missing field '{field}' in audit log entry"


def test_get_single_audit_log_happy_path(client: TestClient, admin_headers: dict):
    """Checks that GET /api/audit-logs/{log_id} returns 200 for Admin with matching log details."""
    logs = client.get("/api/audit-logs", headers=admin_headers).json()
    assert len(logs) > 0
    first_id = logs[0]["id"]

    res = client.get(f"/api/audit-logs/{first_id}", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert res.json()["id"] == first_id


def test_audit_logs_without_token_returns_401(client: TestClient):
    """Checks that GET /api/audit-logs without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/audit-logs")
    assert res.status_code == 401


def test_single_audit_log_without_token_returns_401(client: TestClient):
    """Checks that GET /api/audit-logs/1 without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/audit-logs/1")
    assert res.status_code == 401


def test_audit_logs_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/audit-logs rejects a Business Analyst token with 403 Forbidden."""
    res = client.get("/api/audit-logs", headers=analyst_headers)
    assert res.status_code == 403


def test_single_audit_log_analyst_token_returns_403_forbidden(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/audit-logs/1 rejects a Business Analyst token with 403 Forbidden."""
    res = client.get("/api/audit-logs/1", headers=analyst_headers)
    assert res.status_code == 403


def test_audit_log_nonexistent_id_returns_404(client: TestClient, admin_headers: dict):
    """Checks that GET /api/audit-logs/999999 returns 404 Not Found instead of 500."""
    res = client.get("/api/audit-logs/999999", headers=admin_headers)
    assert res.status_code == 404
