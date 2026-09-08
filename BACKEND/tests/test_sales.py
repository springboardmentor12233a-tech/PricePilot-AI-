def test_sales_recording_and_analytics_flow(client, auth_headers):
    """Test recording sales transactions, deducting stock, and fetching analytics."""
    # 1. Setup Org & Product
    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Sales Org"},
        headers=auth_headers,
    ).json()["id"]

    prod_id = client.post(
        "/api/v1/products/",
        json={
            "name": "Mechanical Keyboard",
            "sku": "KB-001",
            "organization_id": org_id,
            "cost_price": "60.00",
            "base_price": "100.00",
        },
        headers=auth_headers,
    ).json()["id"]

    # Stock inventory to 20 units
    client.put(
        f"/api/v1/products/{prod_id}/inventory",
        json={"quantity_on_hand": 20},
        headers=auth_headers,
    )

    # 2. Record Sale 1 (2 units @ 100.00)
    sale1_resp = client.post(
        "/api/v1/sales/",
        json={
            "organization_id": org_id,
            "product_id": prod_id,
            "quantity": 2,
            "unit_price": "100.00",
        },
        headers=auth_headers,
    )
    assert sale1_resp.status_code == 201
    sale1 = sale1_resp.json()
    assert sale1["total_amount"] == "200.00"

    # 3. Record Sale 2 (3 units @ 95.00)
    sale2_resp = client.post(
        "/api/v1/sales/",
        json={
            "organization_id": org_id,
            "product_id": prod_id,
            "quantity": 3,
            "unit_price": "95.00",
        },
        headers=auth_headers,
    )
    assert sale2_resp.status_code == 201
    sale2 = sale2_resp.json()
    assert sale2["total_amount"] == "285.00"

    # 4. Check Inventory Stock (20 - 5 = 15)
    inv = client.get(f"/api/v1/products/{prod_id}/inventory", headers=auth_headers).json()
    assert inv["quantity_on_hand"] == 15

    # 5. Fetch Sales Analytics
    analytics_resp = client.get(f"/api/v1/sales/analytics/{org_id}", headers=auth_headers)
    assert analytics_resp.status_code == 200
    analytics = analytics_resp.json()
    assert analytics["total_sales_count"] == 2
    assert analytics["units_sold"] == 5
    assert analytics["total_revenue"] == "485.00"
    assert analytics["average_order_value"] == "242.50"
