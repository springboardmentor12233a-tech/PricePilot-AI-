"""
Business intelligence reports and portfolio export test suite for PricePilot AI.
"""

from fastapi.testclient import TestClient


def test_download_summary_report_pdf_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/reports/summary?format=pdf returns 200 with application/pdf content."""
    res = client.get("/api/reports/summary?format=pdf", headers=analyst_headers)
    assert res.status_code == 200, res.text
    assert res.headers.get("content-type") == "application/pdf"
    assert len(res.content) > 1000


def test_download_summary_report_csv_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/reports/summary?format=csv returns 200 with text/csv content."""
    res = client.get("/api/reports/summary?format=csv", headers=analyst_headers)
    assert res.status_code == 200, res.text
    assert "text/csv" in res.headers.get("content-type", "")
    assert len(res.content) > 100


def test_download_price_comparison_pdf_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/reports/price-comparison/{id} returns 200 with valid single-SKU PDF."""
    res = client.get("/api/reports/price-comparison/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    assert res.headers.get("content-type") == "application/pdf"
    assert len(res.content) > 5000


def test_download_summary_without_token_returns_401(client: TestClient):
    """Checks that GET /api/reports/summary without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/reports/summary")
    assert res.status_code == 401


def test_download_price_comparison_without_token_returns_401(client: TestClient):
    """Checks that GET /api/reports/price-comparison/prod_001 without token rejects with 401 Unauthorized."""
    res = client.get("/api/reports/price-comparison/prod_001")
    assert res.status_code == 401


def test_download_price_comparison_nonexistent_product_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/reports/price-comparison/prod_999 returns 404 Not Found instead of 500."""
    res = client.get("/api/reports/price-comparison/prod_999", headers=analyst_headers)
    assert res.status_code == 404
