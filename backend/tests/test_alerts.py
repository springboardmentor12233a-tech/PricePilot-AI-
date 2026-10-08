"""
Proactive alerts and pricing anomaly notifications test suite for PricePilot AI.
"""

from fastapi.testclient import TestClient


def test_list_alerts_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/alerts returns 200 with active proactive alert objects and metadata."""
    res = client.get("/api/alerts", headers=analyst_headers)
    assert res.status_code == 200, res.text
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0
    first = alerts[0]
    for field in ("alert_id", "product_id", "severity", "type", "title", "message", "suggested_action"):
        assert field in first, f"Missing field '{field}' in alert item"


def test_get_alert_by_id_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/alerts/{alert_id} returns 200 with the matching alert details."""
    list_res = client.get("/api/alerts", headers=analyst_headers)
    alerts = list_res.json()
    assert len(alerts) > 0
    target_id = alerts[0]["alert_id"]

    res = client.get(f"/api/alerts/{target_id}", headers=analyst_headers)
    assert res.status_code == 200, res.text
    assert res.json()["alert_id"] == target_id


def test_dismiss_alert_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that POST /api/alerts/{alert_id}/dismiss removes the alert and returns status dismissed."""
    list_res = client.get("/api/alerts", headers=analyst_headers)
    alerts = list_res.json()
    assert len(alerts) > 0
    target_id = alerts[0]["alert_id"]

    res = client.post(f"/api/alerts/{target_id}/dismiss", headers=analyst_headers)
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "dismissed"
    assert res.json()["alert_id"] == target_id


def test_list_alerts_without_token_returns_401(client: TestClient):
    """Checks that GET /api/alerts without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/alerts")
    assert res.status_code == 401


def test_get_alert_by_id_without_token_returns_401(client: TestClient):
    """Checks that GET /api/alerts/alert_gap_prod_001 without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/alerts/alert_gap_prod_001")
    assert res.status_code == 401


def test_dismiss_alert_without_token_returns_401(client: TestClient):
    """Checks that POST /api/alerts/alert_gap_prod_001/dismiss without token rejects with 401 Unauthorized."""
    res = client.post("/api/alerts/alert_gap_prod_001/dismiss")
    assert res.status_code == 401


def test_get_nonexistent_alert_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/alerts/alert_nonexistent_999 returns 404 Not Found instead of 500."""
    res = client.get("/api/alerts/alert_nonexistent_999", headers=analyst_headers)
    assert res.status_code == 404
