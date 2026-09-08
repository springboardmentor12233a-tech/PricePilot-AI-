def test_pricing_prediction_and_recommendation_flow(client, auth_headers):
    """Test AI pricing prediction, saving recommendation, applying recommendation, and price history."""
    # 1. Setup Org & Product
    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Pricing Org"},
        headers=auth_headers,
    ).json()["id"]

    prod_id = client.post(
        "/api/v1/products/",
        json={
            "name": "Gaming Mouse",
            "sku": "MOUSE-001",
            "organization_id": org_id,
            "cost_price": "50.00",
            "base_price": "80.00",
        },
        headers=auth_headers,
    ).json()["id"]

    # 2. Predict Optimal Price
    pred_resp = client.post(
        "/api/v1/pricing/predict",
        json={"product_id": prod_id, "target_margin_percent": 30.0},
        headers=auth_headers,
    )
    assert pred_resp.status_code == 200
    prediction = pred_resp.json()
    assert prediction["product_id"] == prod_id
    assert "recommended_price" in prediction
    recommended_price = prediction["recommended_price"]

    # 3. Create Recommendation
    rec_resp = client.post(
        "/api/v1/pricing/recommendations",
        json={
            "product_id": prod_id,
            "current_price": "80.00",
            "recommended_price": recommended_price,
            "demand_factor": prediction["demand_factor"],
            "recommendation_reason": prediction["recommendation_reason"],
        },
        headers=auth_headers,
    )
    assert rec_resp.status_code == 201
    rec = rec_resp.json()
    rec_id = rec["id"]
    assert rec["status"] == "pending"

    # 4. Apply Recommendation
    apply_resp = client.post(
        f"/api/v1/pricing/recommendations/{rec_id}/apply",
        headers=auth_headers,
    )
    assert apply_resp.status_code == 200
    applied_rec = apply_resp.json()
    assert applied_rec["status"] == "accepted"

    # 5. Verify product price was updated
    updated_prod = client.get(f"/api/v1/products/{prod_id}", headers=auth_headers).json()
    assert updated_prod["base_price"] == str(recommended_price)

    # 6. Verify Price History
    history_resp = client.get(f"/api/v1/pricing/history/{prod_id}", headers=auth_headers)
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 1
    assert history[0]["old_price"] == "80.00"
    assert history[0]["new_price"] == str(recommended_price)
