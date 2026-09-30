"""
Test Suite: Competitor / Market Analysis Endpoint
"""

def test_competitor_endpoint_structure(client, analyst_headers):
    response = client.get("/api/competitor?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "293375605257"
    assert data["store_id"] == 1
    assert data["store_price"] > 0
    assert "internal_digital_channel" in data
    assert "cross_store_dispersion" in data
    assert "category_peer_benchmark" in data
    assert "market_position" in data
    assert "pricing_opportunity" in data
    assert data["external_competitor_available"] is False
    assert "internal digital channel" in data["notice"].lower()


def test_competitor_market_position_values(client, analyst_headers):
    response = client.get("/api/competitor?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    pos = data["market_position"]["market_position"]
    assert pos in ["Below Peer Benchmark", "Near Peer Benchmark", "Above Peer Benchmark", "Unclassified / Insufficient Peers"]


def test_competitor_opportunity_signals(client, analyst_headers):
    response = client.get("/api/competitor?item_id=293375605257&store_id=1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    sig = data["pricing_opportunity"]["opportunity_signal"]
    assert sig in [
        "HEADROOM_OPPORTUNITY_REVIEW",
        "PREMIUM_MARGIN_REVIEW",
        "CHANNEL_DISPARITY_REVIEW",
        "PROMO_DEPTH_REVIEW",
        "ALIGNED_STABLE",
    ]
