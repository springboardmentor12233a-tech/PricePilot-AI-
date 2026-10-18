import uuid


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


def test_pricing_prediction_contract_uses_real_available_values(client, auth_headers):
    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Pricing Contract Org"},
        headers=auth_headers,
    ).json()["id"]
    product = client.post(
        "/api/v1/products/",
        json={
            "name": "Contract Product",
            "sku": "CONTRACT-001",
            "organization_id": org_id,
            "cost_price": "40.00",
            "base_price": "80.00",
        },
        headers=auth_headers,
    ).json()

    product_list = client.get(
        f"/api/v1/products/organization/{org_id}",
        headers=auth_headers,
    )
    assert product_list.status_code == 200
    assert isinstance(product_list.json(), list)
    assert product_list.json()[0]["id"] == product["id"]

    response = client.post(
        "/api/v1/pricing/predict",
        json={"product_id": product["id"], "target_margin_percent": 25},
        headers=auth_headers,
    )
    assert response.status_code == 200
    analysis = response.json()
    assert analysis["current_price"] == "80.00"
    assert float(analysis["recommended_price"]) > 0
    assert analysis["competitor_avg_price"] is None
    assert "recommendation_reason" in analysis
    assert "predicted_demand" not in analysis
    assert "confidence" not in analysis


def test_product_selector_empty_catalog_contract_is_raw_empty_array(client, auth_headers):
    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Empty Pricing Catalog"},
        headers=auth_headers,
    ).json()["id"]

    response = client.get(
        f"/api/v1/products/organization/{org_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json() == []


def test_pricing_rejects_invalid_margin_and_unsafe_recommendations(client, auth_headers):
    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Pricing Validation Org"},
        headers=auth_headers,
    ).json()["id"]
    product = client.post(
        "/api/v1/products/",
        json={
            "name": "Validation Product",
            "sku": "VALIDATE-001",
            "organization_id": org_id,
            "cost_price": "50.00",
            "base_price": "80.00",
        },
        headers=auth_headers,
    ).json()

    invalid_prediction = client.post(
        "/api/v1/pricing/predict",
        json={"product_id": product["id"], "target_margin_percent": -1},
        headers=auth_headers,
    )
    assert invalid_prediction.status_code == 422

    below_floor = client.post(
        "/api/v1/pricing/recommendations",
        json={
            "product_id": product["id"],
            "current_price": "80.00",
            "recommended_price": "50.00",
        },
        headers=auth_headers,
    )
    assert below_floor.status_code == 422

    stale_baseline = client.post(
        "/api/v1/pricing/recommendations",
        json={
            "product_id": product["id"],
            "current_price": "81.00",
            "recommended_price": "60.00",
        },
        headers=auth_headers,
    )
    assert stale_baseline.status_code == 409

    product_without_cost = client.post(
        "/api/v1/products/",
        json={
            "name": "Missing Cost Product",
            "sku": "VALIDATE-NOCOST",
            "organization_id": org_id,
            "base_price": "80.00",
        },
        headers=auth_headers,
    ).json()
    missing_cost = client.post(
        "/api/v1/pricing/predict",
        json={"product_id": product_without_cost["id"]},
        headers=auth_headers,
    )
    assert missing_cost.status_code == 422
    assert "cost price is required" in missing_cost.json()["detail"].lower()


def test_pricing_prediction_handles_missing_inventory_without_fabricating_stock(client, auth_headers, db_session):
    from app.models.inventory import Inventory

    org_id = client.post(
        "/api/v1/organizations/",
        json={"name": "Optional Pricing Signals Org"},
        headers=auth_headers,
    ).json()["id"]
    product = client.post(
        "/api/v1/products/",
        json={
            "name": "Optional Signal Product",
            "sku": "OPTIONAL-001",
            "organization_id": org_id,
            "cost_price": "40.00",
            "base_price": "80.00",
        },
        headers=auth_headers,
    ).json()
    db_session.query(Inventory).filter(Inventory.product_id == uuid.UUID(product["id"])).delete()
    db_session.commit()

    response = client.post(
        "/api/v1/pricing/predict",
        json={"product_id": product["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["demand_factor"] is None
    assert response.json()["competitor_avg_price"] is None
