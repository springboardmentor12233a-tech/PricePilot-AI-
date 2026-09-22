import uuid
import pytest
from fastapi import status


class TestMultiTenantIsolation:
    """Verify strict tenant data isolation between Organization A and Organization B."""

    def test_cross_organization_access_forbidden(self, client, auth_headers):
        # 1. Register User B and Org B
        reg_b = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"user_b_{uuid.uuid4().hex[:8]}@example.com",
                "password": "Password123!",
                "full_name": "User B",
            },
        )
        assert reg_b.status_code == status.HTTP_201_CREATED
        user_b_id = reg_b.json()["id"]

        login_b = client.post(
            "/api/v1/auth/login",
            json={"email": reg_b.json()["email"], "password": "Password123!"},
        )
        assert login_b.status_code == status.HTTP_200_OK
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Create Org B
        create_org_b = client.post(
            "/api/v1/organizations/",
            json={"name": f"Org B {uuid.uuid4().hex[:6]}"},
            headers=headers_b,
        )
        assert create_org_b.status_code == status.HTTP_201_CREATED
        org_b_id = create_org_b.json()["id"]

        # 2. Setup Org A with User A (from fixtures)
        create_org_a = client.post(
            "/api/v1/organizations/",
            json={"name": f"Org A {uuid.uuid4().hex[:6]}"},
            headers=auth_headers,
        )
        assert create_org_a.status_code == status.HTTP_201_CREATED
        org_a_id = create_org_a.json()["id"]

        # Create Product A under Org A
        create_prod_a = client.post(
            "/api/v1/products/",
            json={
                "organization_id": org_a_id,
                "name": "Flagship Product A",
                "sku": f"SKU-A-{uuid.uuid4().hex[:6]}",
                "base_price": 4999.00,
                "cost_price": 2500.00,
                "currency": "INR",
            },
            headers=auth_headers,
        )
        assert create_prod_a.status_code == status.HTTP_201_CREATED
        prod_a_id = create_prod_a.json()["id"]

        # Create Category A under Org A
        create_cat_a = client.post(
            "/api/v1/categories/",
            json={"organization_id": org_a_id, "name": "Electronics A"},
            headers=auth_headers,
        )
        assert create_cat_a.status_code == status.HTTP_201_CREATED

        # 3. User B attempts unauthorized access to Org A resources
        # A) Attempt to list Org A products
        list_resp = client.get(
            f"/api/v1/products/organization/{org_a_id}",
            headers=headers_b,
        )
        assert list_resp.status_code == status.HTTP_403_FORBIDDEN

        # B) Attempt to view Product A detail
        detail_resp = client.get(
            f"/api/v1/products/{prod_a_id}",
            headers=headers_b,
        )
        assert detail_resp.status_code == status.HTTP_403_FORBIDDEN

        # C) Attempt to modify Product A
        update_resp = client.put(
            f"/api/v1/products/{prod_a_id}",
            json={"name": "Hacked Product Name"},
            headers=headers_b,
        )
        assert update_resp.status_code == status.HTTP_403_FORBIDDEN

        # D) Attempt to delete Product A
        delete_resp = client.delete(
            f"/api/v1/products/{prod_a_id}",
            headers=headers_b,
        )
        assert delete_resp.status_code == status.HTTP_403_FORBIDDEN

        # E) Attempt to access Org A categories
        cat_resp = client.get(
            f"/api/v1/categories/organization/{org_a_id}",
            headers=headers_b,
        )
        assert cat_resp.status_code == status.HTTP_403_FORBIDDEN

        # F) Attempt to view Org A sales analytics
        sales_resp = client.get(
            f"/api/v1/sales/analytics/{org_a_id}",
            headers=headers_b,
        )
        assert sales_resp.status_code == status.HTTP_403_FORBIDDEN

        # G) Attempt to run pricing prediction on Product A
        price_pred_resp = client.post(
            "/api/v1/pricing/predict",
            json={"product_id": prod_a_id},
            headers=headers_b,
        )
        assert price_pred_resp.status_code == status.HTTP_403_FORBIDDEN

        # H) Attempt to fetch Product A price history
        history_resp = client.get(
            f"/api/v1/pricing/history/{prod_a_id}",
            headers=headers_b,
        )
        assert history_resp.status_code == status.HTTP_403_FORBIDDEN


class TestMLInferencePipeline:
    """Verify ML model inference via POST /api/v2/ai/predict."""

    def test_personal_model_predict(self, client, auth_headers):
        features = {
            "Price": 1299.00,
            "Discount": 10.0,
            "Units Ordered": 25,
            "Inventory Level": 100,
            "Competitor Pricing": 1350.00,
            "Category": "Electronics",
            "Store ID": "Store-101",
        }
        response = client.post(
            "/api/v2/ai/predict",
            json={"features": features},
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "prediction" in data
        assert isinstance(data["prediction"], float)
        assert data["prediction"] >= 0.0
        assert "timestamp" in data

    def test_personal_model_empty_features_rejected(self, client, auth_headers):
        response = client.post(
            "/api/v2/ai/predict",
            json={"features": {}},
            headers=auth_headers,
        )
        # Empty dictionary should return 400/422 validation error, never 500
        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY)


class TestPricingWorkflowEndToEnd:
    """Verify pricing prediction, recommendation creation, application, and history audit log."""

    def test_pricing_lifecycle(self, client, auth_headers):
        # 0. Create organization
        org_res = client.post(
            "/api/v1/organizations/",
            json={"name": f"Pricing Org {uuid.uuid4().hex[:6]}"},
            headers=auth_headers,
        )
        assert org_res.status_code == status.HTTP_201_CREATED
        org_id = org_res.json()["id"]

        # 1. Create product
        prod_res = client.post(
            "/api/v1/products/",
            json={
                "organization_id": org_id,
                "name": "Audit Test Headphone",
                "sku": f"HP-{uuid.uuid4().hex[:6]}",
                "base_price": 2999.00,
                "cost_price": 1500.00,
                "currency": "INR",
            },
            headers=auth_headers,
        )
        assert prod_res.status_code == status.HTTP_201_CREATED
        prod_id = prod_res.json()["id"]

        # 2. Predict optimal price
        pred_res = client.post(
            "/api/v1/pricing/predict",
            json={"product_id": prod_id, "target_margin_percent": 25.0},
            headers=auth_headers,
        )
        assert pred_res.status_code == status.HTTP_200_OK
        pred_data = pred_res.json()
        assert float(pred_data["recommended_price"]) > 0.0
        assert float(pred_data["current_price"]) == 2999.00

        # 3. Create recommendation
        rec_res = client.post(
            "/api/v1/pricing/recommendations",
            json={
                "product_id": prod_id,
                "current_price": 2999.00,
                "recommended_price": pred_data["recommended_price"],
                "recommendation_reason": "AI margin floor optimization",
            },
            headers=auth_headers,
        )
        assert rec_res.status_code == status.HTTP_201_CREATED
        rec_id = rec_res.json()["id"]

        # 4. Apply recommendation
        apply_res = client.post(
            f"/api/v1/pricing/recommendations/{rec_id}/apply",
            headers=auth_headers,
        )
        assert apply_res.status_code == status.HTTP_200_OK
        assert apply_res.json()["status"] == "accepted"

        # 5. Verify product base price was updated
        prod_updated = client.get(
            f"/api/v1/products/{prod_id}",
            headers=auth_headers,
        )
        assert prod_updated.status_code == status.HTTP_200_OK
        assert float(prod_updated.json()["base_price"]) == float(pred_data["recommended_price"])

        # 6. Verify price history audit entry exists
        hist_res = client.get(
            f"/api/v1/pricing/history/{prod_id}",
            headers=auth_headers,
        )
        assert hist_res.status_code == status.HTTP_200_OK
        history_list = hist_res.json()
        assert len(history_list) >= 1
        assert float(history_list[0]["old_price"]) == 2999.00
        assert float(history_list[0]["new_price"]) == float(pred_data["recommended_price"])
