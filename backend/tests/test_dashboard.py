"""
Test Suite: Dashboard Summary Endpoint
======================================
Verifies live aggregate KPIs, real time-series trends (revenue, sales, pricing, demand),
category performance breakdown, RBAC permissions, and authentic schema validity.
"""

def test_dashboard_summary_success_business_analyst(client, analyst_headers):
    response = client.get("/api/dashboard/summary", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["total_evaluated_records"] >= 10000
    assert data["unique_items_count"] > 0
    assert data["unique_stores_count"] == 4
    assert data["_dataSource"] == "LIVE_API"
    assert data["_isMock"] is False

    # KPI Sections
    assert "revenue_kpis" in data
    assert data["revenue_kpis"]["total_realized_revenue"] > 0
    assert data["revenue_kpis"]["avg_daily_revenue"] > 0
    assert data["revenue_kpis"]["revenue_per_unit"] > 0

    assert "demand_kpis" in data
    assert data["demand_kpis"]["total_units_sold"] > 0
    assert data["demand_kpis"]["avg_daily_units"] > 0

    assert "pricing_kpis" in data
    assert data["pricing_kpis"]["avg_reference_price"] > 0
    assert data["pricing_kpis"]["avg_recommended_price"] > 0

    assert "market_position_summary" in data
    assert "opportunity_summary" in data
    assert data["high_priority_action_count"] >= 0

    # Real time-series trend arrays
    assert "revenue_trend" in data
    assert isinstance(data["revenue_trend"], list)
    assert len(data["revenue_trend"]) > 0
    for pt in data["revenue_trend"]:
        assert "date" in pt
        assert "revenue" in pt
        assert "target" in pt
        assert pt["revenue"] > 0

    assert "sales_trend" in data
    assert isinstance(data["sales_trend"], list)
    assert len(data["sales_trend"]) > 0
    for pt in data["sales_trend"]:
        assert "date" in pt
        assert "units" in pt
        assert "promoUnits" in pt

    assert "price_comparison_trend" in data
    assert isinstance(data["price_comparison_trend"], list)
    assert len(data["price_comparison_trend"]) > 0
    for pt in data["price_comparison_trend"]:
        assert "date" in pt
        assert "referencePrice" in pt
        assert "recommendedPrice" in pt
        assert pt["referencePrice"] > 0

    assert "demand_forecast_trend" in data
    assert isinstance(data["demand_forecast_trend"], list)
    assert len(data["demand_forecast_trend"]) > 0

    assert "category_performance" in data
    assert isinstance(data["category_performance"], list)
    assert len(data["category_performance"]) > 0


def test_dashboard_summary_success_user_role(client, user_headers):
    response = client.get("/api/dashboard/summary", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_evaluated_records"] > 0


def test_dashboard_summary_rbac_admin_blocked(client, admin_headers):
    response = client.get("/api/dashboard/summary", headers=admin_headers)
    assert response.status_code == 403


def test_dashboard_summary_unauthenticated(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 401
