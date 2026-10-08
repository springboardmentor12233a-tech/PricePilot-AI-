"""
AI insights and conversational intelligence proxy test suite for PricePilot AI.
"""

from fastapi.testclient import TestClient


def test_list_insights_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/insight returns 200 with baseline insight summaries for all products."""
    res = client.get("/api/insight", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 8
    first = data[0]
    for field in ("product_id", "product_name", "llm_summary", "confidence_score", "demand_trend"):
        assert field in first, f"Missing field '{field}' in insight summary"


def test_get_product_insight_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/insight/product/{id} returns 200 with structured pricing recommendation."""
    res = client.get("/api/insight/product/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "recommendation" in data
    rec = data["recommendation"]
    for field in ("action", "reasoning", "urgency", "expected_impact"):
        assert field in rec, f"Missing key '{field}' in structured recommendation"
    assert rec["action"] in ("reduce price", "increase price", "hold", "investigate")


def test_chat_query_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that POST /api/insight/chat returns 200 with answer grounded in portfolio metrics."""
    payload = {"question": "What is the recommended price for Sony headphones?", "context_product_id": "prod_001"}
    res = client.post("/api/insight/chat", headers=analyst_headers, json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "answer" in data
    assert "source" in data
    assert bool(data["answer"]) is True


def test_list_insights_without_token_returns_401(client: TestClient):
    """Checks that GET /api/insight without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/insight")
    assert res.status_code == 401


def test_get_product_insight_without_token_returns_401(client: TestClient):
    """Checks that GET /api/insight/product/prod_001 without token rejects with 401 Unauthorized."""
    res = client.get("/api/insight/product/prod_001")
    assert res.status_code == 401


def test_chat_query_without_token_returns_401(client: TestClient):
    """Checks that POST /api/insight/chat without authorization token rejects with 401 Unauthorized."""
    res = client.post("/api/insight/chat", json={"question": "What is the highest revenue SKU?"})
    assert res.status_code == 401


def test_get_insight_nonexistent_product_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/insight/product/prod_999 returns 404 Not Found instead of 500."""
    res = client.get("/api/insight/product/prod_999", headers=analyst_headers)
    assert res.status_code == 404
