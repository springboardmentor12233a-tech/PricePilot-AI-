def test_competitor_price_tracking_flow(client, auth_headers):
    """Test creating competitor, matching product, logging competitor price, and querying price history."""
    # 1. Setup Org & Product
    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Comp Org"},
        headers=auth_headers,
    ).json()["id"]

    prod_id = client.post(
        "/api/v1/products/",
        json={
            "name": "Smart Watch",
            "sku": "WATCH-001",
            "organization_id": org_id,
            "cost_price": "200.00",
            "base_price": "299.99",
        },
        headers=auth_headers,
    ).json()["id"]

    # 2. Create Competitor
    comp_resp = client.post(
        "/api/v1/competitors/",
        json={"name": "MegaStore", "organization_id": org_id, "website": "https://megastore.com"},
        headers=auth_headers,
    )
    assert comp_resp.status_code == 201
    comp_id = comp_resp.json()["id"]

    # 3. Match Competitor Product
    match_resp = client.post(
        "/api/v1/competitors/match",
        json={
            "competitor_id": comp_id,
            "product_id": prod_id,
            "name": "MegaStore Smart Watch Gen 1",
            "url": "https://megastore.com/watch",
            "match_confidence": "0.95",
        },
        headers=auth_headers,
    )
    assert match_resp.status_code == 201
    comp_prod_id = match_resp.json()["id"]

    # 4. Log Competitor Price
    price_resp = client.post(
        "/api/v1/competitors/prices",
        json={
            "competitor_product_id": comp_prod_id,
            "price": "279.99",
            "currency": "INR",
            "availability": True,
        },
        headers=auth_headers,
    )
    assert price_resp.status_code == 201
    assert price_resp.json()["price"] == "279.99"

    # 5. Fetch competitor prices for product
    history_resp = client.get(f"/api/v1/competitors/product/{prod_id}/prices", headers=auth_headers)
    assert history_resp.status_code == 200
    prices = history_resp.json()
    assert len(prices) == 1
    assert prices[0]["price"] == "279.99"
