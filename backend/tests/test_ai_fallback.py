from app.ai import ai_service


def test_deterministic_fallback_used_when_no_llm_configured(monkeypatch):
    monkeypatch.setattr("app.ai.groq_service.is_configured", lambda: False)
    monkeypatch.setattr("app.ai.gemini_service.is_configured", lambda: False)

    context = {
        "kpis": {"profit_margin_pct_estimated": 3.0},
        "competitor_analysis": [],
        "stockout_risks": [],
    }
    recs, source = ai_service.generate_recommendations(context)
    assert source == "deterministic"
    assert len(recs) >= 1
    assert recs[0]["category"] == "Revenue"


def test_chat_falls_back_when_llms_fail(monkeypatch):
    monkeypatch.setattr("app.ai.groq_service.is_configured", lambda: False)
    monkeypatch.setattr("app.ai.gemini_service.is_configured", lambda: False)

    answer, source = ai_service.answer_chat(
        "What is our top revenue product?",
        {
            "top_products": [
                {
                    "product_id": "P1062",
                    "product_name": "Urbana Flight - Economy Lite",
                    "category": "Travel & Hospitality",
                    "revenue": 17864161.14,
                    "units": 33127,
                }
            ]
        },
    )
    assert source == "deterministic"
    assert "Top products by revenue" in answer
    assert "Urbana Flight - Economy Lite" in answer
    assert "$17,864,161.14" in answer
    assert "33,127 units sold" in answer
    assert "[{" not in answer
