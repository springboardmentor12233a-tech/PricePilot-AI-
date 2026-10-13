import os
from datetime import date, timedelta

import pandas as pd
import pytest

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")


@pytest.fixture(scope="module", autouse=True)
def synthetic_feature_table():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    rows = []
    base_date = date(2024, 1, 1)
    for i in range(90):
        d = base_date + timedelta(days=i)
        rows.append({
            "date": d, "product_id": "P9001", "category": "TestCat",
            "cost_price": 10.0, "base_price": 25.0, "final_price": 25.0 - (i % 5),
            "units_sold": 10 + (i % 7), "revenue": (25.0 - (i % 5)) * (10 + (i % 7)),
            "discount_pct": 0, "competitor_avg_price": 24.0, "competitor_min_price": 22.0,
            "market_demand_index": 75.0, "stock_available": 100 - i, "is_weekend": 0,
            "is_holiday": 0, "is_festival_season": 0, "is_promotional_event": 0,
            "inflation_rate_pct": 3.0, "consumer_confidence_index": 100.0, "rating": 4.2,
            "num_reviews": 50, "price_change_pct": 0, "competitor_price_gap": 1.0,
            "competitor_price_ratio": 1.04, "lag_1": 10, "lag_7": 10, "rolling_mean_7": 10,
            "month": d.month, "quarter": (d.month - 1) // 3 + 1,
        })
    pd.DataFrame(rows).to_csv(os.path.join(PROCESSED_DIR, "feature_table.csv"), index=False)
    yield


def test_price_optimize_returns_estimates(client, admin_token):
    resp = client.post("/api/pricing/optimize", json={"product_id": "P9001", "objective": "revenue"},
                        headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["current_price"] > 0
    assert body["recommended_price"] > 0
    assert "explanation_factors" in body


def test_price_optimize_missing_product(client, admin_token):
    resp = client.post("/api/pricing/optimize", json={"product_id": "NOPE", "objective": "revenue"},
                        headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 404


def test_demand_forecast_has_confidence_score(client, admin_token):
    resp = client.post("/api/forecast/demand", json={"product_id": "P9001", "horizon_days": 7},
                        headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert 0 <= body["confidence_score"] <= 100
    assert body["confidence_label"] in {"High Confidence", "Medium Confidence", "Low Confidence"}
    assert body["trend"] in {"Increasing Demand", "Stable Demand", "Decreasing Demand"}
    assert len(body["forecast"]) == 7
