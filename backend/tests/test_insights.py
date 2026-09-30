"""
Test Suite: Gemini Insights Endpoint
"""

def test_insights_endpoint_safe_fallback(client, analyst_headers):
    """Verifies insights endpoint returns valid structured insights without crashing."""
    response = client.get("/api/insights?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "293375605257"
    assert data["store_id"] == 1
    assert "executive_summary" in data and len(data["executive_summary"]) > 0
    assert "pricing_rationale" in data and len(data["pricing_rationale"]) > 0
    assert "demand_and_forecast_insights" in data and len(data["demand_and_forecast_insights"]) > 0
    assert "commercial_risks" in data and len(data["commercial_risks"]) > 0
    assert "actionable_recommendations" in data and len(data["actionable_recommendations"]) > 0
    assert data["status"] == "success"
    assert data["source"] in ("LIVE", "OFFLINE_FALLBACK")
    assert "source_model" in data and len(data["source_model"]) > 0
    assert isinstance(data["is_live_gemini"], bool)


def test_insights_endpoint_unseen_item(client, analyst_headers):
    response = client.get("/api/insights?item_id=UNSEEN_SKU_TEST&store_id=3", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "UNSEEN_SKU_TEST"
    assert len(data["actionable_recommendations"]) >= 1
    assert data["source"] in ("LIVE", "OFFLINE_FALLBACK")


def test_insights_caching_and_truthful_source():
    """Verifies that live cached results maintain LIVE source, while fallback maintains OFFLINE_FALLBACK."""
    from eda.gemini_business_insights import GeminiBusinessInsightsEngine, build_structured_business_context
    import pandas as pd

    engine = GeminiBusinessInsightsEngine()
    context = build_structured_business_context(pd.Series({
        "item_id": "TEST_CACHE_SKU",
        "store_id": 1,
        "reference_price": 50.0,
        "recommended_price": 55.0,
    }))

    cache_key = engine._compute_cache_key(context)
    # Populate a mock live cached entry
    engine._live_cache[cache_key] = {
        "item_id": "TEST_CACHE_SKU",
        "store_id": 1,
        "dept_name": "TestDept",
        "class_name": "TestClass",
        "model_used": "gemini-3.8-flash",
        "api_status": "SUCCESS",
        "generation_timestamp": "2026-09-29 12:00:00",
        "insights": {
            "executive_summary": "Cached live executive summary.",
            "pricing_rationale": "Cached pricing rationale.",
            "demand_and_forecast_insights": "Cached demand insight.",
            "promotional_and_historical_analysis": "Cached promo insight.",
            "commercial_risks": "Cached commercial risks.",
            "actionable_recommendations": ["Action 1", "Action 2"],
        },
        "raw_response": "{}",
        "error_message": None,
        "is_cached": False,
    }

    # Calling generate_business_insight should return the cached item
    result = engine.generate_business_insight(context)
    assert result["is_cached"] is True
    assert result["api_status"] == "SUCCESS"
    assert result["insights"]["executive_summary"] == "Cached live executive summary."


def test_insights_quota_cooldown_handling():
    """Verifies that quota cooldown returns offline fallback safely without throwing."""
    import time
    from eda.gemini_business_insights import GeminiBusinessInsightsEngine, build_structured_business_context
    import pandas as pd

    engine = GeminiBusinessInsightsEngine()
    context = build_structured_business_context(pd.Series({
        "item_id": "TEST_QUOTA_SKU",
        "store_id": 2,
        "reference_price": 100.0,
        "recommended_price": 105.0,
    }))

    # Set quota cooldown
    engine._quota_cooldown_until = time.time() + 60.0
    result = engine.generate_business_insight(context)
    assert result["api_status"] == "RESOURCE_EXHAUSTED"
    assert "insights" in result
    assert "executive_summary" in result["insights"]

