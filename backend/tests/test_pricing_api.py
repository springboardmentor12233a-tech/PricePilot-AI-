from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_kpis_endpoint():
    response = client.get("/pricing/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_profit" in data
    assert "profit_margin" in data


def test_model_endpoint():
    response = client.get("/pricing/model")
    assert response.status_code == 200
    assert "models" in response.json()


def test_market_endpoint():
    response = client.get("/pricing/market")
    assert response.status_code == 200
    data = response.json()
    assert "competitors" in data
    assert "promotions" in data