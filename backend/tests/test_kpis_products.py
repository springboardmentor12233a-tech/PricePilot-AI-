def test_kpis_are_computed_not_fake(client, admin_token):
    resp = client.get("/api/dashboard/kpis", headers={"Authorization": f"Bearer {admin_token}"})
    body = resp.json()
    assert body["total_units_sold"] > 0
    assert body["active_products"] == 1
    # gross profit must equal revenue minus estimated cost, computed, not hard-coded
    assert abs(body["gross_profit_estimated"] - (body["total_revenue"] - body["estimated_cost"])) < 0.01


def test_products_listed(client, admin_token):
    resp = client.get("/api/products", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["product_id"] == "P9001"


def test_product_not_found(client, admin_token):
    resp = client.get("/api/products/P0000", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 404


def test_invalid_input_rejected(client, admin_token):
    resp = client.post("/api/pricing/optimize", json={"product_id": 123}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 422
