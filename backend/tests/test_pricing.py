"""
Pricing optimization and econometric model validation test suite for PricePilot AI.
"""

import math
import pandas as pd
from fastapi.testclient import TestClient
from app.ml.model_registry import registry


def test_pricing_kpi_summary_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/pricing/summary returns 200 with executive revenue and elasticity metrics."""
    res = client.get("/api/pricing/summary", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    for key in ("total_monthly_revenue", "potential_revenue_lift", "total_products", "model_avg_confidence"):
        assert key in data, f"Missing key '{key}' in pricing KPI summary"
    assert data["total_products"] >= 8


def test_pricing_sweep_by_id_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/pricing/{product_id} returns 200 with candidate prices and revenue projections."""
    res = client.get("/api/pricing/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["product_id"] == "prod_001"
    assert "recommended_price" in data
    assert "sweep" in data
    assert len(data["sweep"]) > 10


def test_pricing_optimize_simulation_happy_path(client: TestClient, analyst_headers: dict):
    """Checks that POST /api/pricing/optimize simulates custom prices returning 200 and demand delta."""
    payload = {"product_id": "prod_001", "custom_price": 329.0}
    res = client.post("/api/pricing/optimize", headers=analyst_headers, json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["product_id"] == "prod_001"
    assert "predicted_revenue" in data
    assert "revenue_delta" in data


def test_pricing_summary_without_token_returns_401(client: TestClient):
    """Checks that GET /api/pricing/summary without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/pricing/summary")
    assert res.status_code == 401


def test_pricing_by_id_without_token_returns_401(client: TestClient):
    """Checks that GET /api/pricing/prod_001 without authorization token rejects with 401 Unauthorized."""
    res = client.get("/api/pricing/prod_001")
    assert res.status_code == 401


def test_pricing_nonexistent_id_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that GET /api/pricing/prod_999 returns 404 Not Found instead of 500 error."""
    res = client.get("/api/pricing/prod_999", headers=analyst_headers)
    assert res.status_code == 404


def test_pricing_optimize_nonexistent_product_returns_404(client: TestClient, analyst_headers: dict):
    """Checks that POST /api/pricing/optimize with nonexistent product_id returns 404 Not Found."""
    res = client.post(
        "/api/pricing/optimize",
        headers=analyst_headers,
        json={"product_id": "prod_999", "custom_price": 99.0},
    )
    assert res.status_code == 404


def test_model_registry_rsquared_and_elasticity_coefficient():
    """Validates real elasticity model parameters: R² is ~0.328 and beta coefficient is ~-71.673."""
    registry.load()
    assert registry.initialized is True
    assert registry.elasticity_model is not None

    r2 = registry.model_r_squared
    beta = registry.elasticity_coef

    # Assert within tight statistical tolerance
    assert math.isclose(r2, 0.328, abs_tol=0.005), f"Expected R² ~ 0.328, got {r2}"
    assert math.isclose(beta, -71.673, abs_tol=0.05), f"Expected beta ~ -71.673, got {beta}"


def test_model_predict_known_input_matches_hand_calculation():
    """Runs a known product and price gap through the model and asserts it matches hand calculation."""
    registry.load()
    model = registry.elasticity_model

    # Evaluation with product 'computers2' and 0.0 price gap
    df_eval = pd.DataFrame({"price_gap_pct": [0.0], "product_id": ["computers2"]})
    model_prediction = float(model.predict(df_eval)[0])

    # Hand calculation: Intercept + C(product_id)[T.computers2] + price_gap_pct * beta
    intercept = float(model.params["Intercept"])
    comp2_coef = float(model.params["C(product_id)[T.computers2]"])
    gap_coef = float(model.params["price_gap_pct"])
    hand_calc = intercept + comp2_coef + (0.0 * gap_coef)

    assert math.isclose(model_prediction, hand_calc, rel_tol=1e-5), (
        f"Model prediction {model_prediction} does not match hand calculation {hand_calc}"
    )

    # Evaluation with non-zero price gap (-0.05)
    gap_test = -0.05
    df_gap = pd.DataFrame({"price_gap_pct": [gap_test], "product_id": ["computers2"]})
    pred_gap = float(model.predict(df_gap)[0])
    hand_calc_gap = intercept + comp2_coef + (gap_test * gap_coef)

    assert math.isclose(pred_gap, hand_calc_gap, rel_tol=1e-5), (
        f"Model prediction {pred_gap} does not match hand calculation {hand_calc_gap}"
    )


def test_pricing_endpoint_recommended_price_within_sweep_and_maximizes_revenue(client: TestClient, analyst_headers: dict):
    """Verifies recommended price is within allowed bounds and achieves highest revenue or cap."""
    res = client.get("/api/pricing/prod_001", headers=analyst_headers)
    assert res.status_code == 200, res.text
    data = res.json()

    current_price = data["current_price"]
    rec_price = data["recommended_price"]
    sweep = data["sweep"]

    # Allowed sweep bounds
    min_allowed = current_price * 0.70
    max_allowed = current_price * 1.30

    assert min_allowed <= rec_price <= max_allowed + 0.01, (
        f"Recommended price {rec_price} is outside allowed range [{min_allowed}, {max_allowed}]"
    )

    # Check that recommended price revenue is highest among candidate points or at guardrail cap
    rec_point = min(sweep, key=lambda pt: abs(pt["price"] - rec_price))
    highest_revenue_point = max(sweep, key=lambda pt: pt["predicted_revenue"])

    is_max_revenue = math.isclose(rec_point["predicted_revenue"], highest_revenue_point["predicted_revenue"], rel_tol=0.01)
    is_at_cap = math.isclose(rec_price, max_allowed, rel_tol=0.01)

    assert is_max_revenue or is_at_cap, (
        f"Recommended price {rec_price} neither achieves max revenue {highest_revenue_point['predicted_revenue']} "
        f"nor reaches the 1.30x cap {max_allowed}"
    )


def test_health_check_endpoint_happy_path(client: TestClient):
    """Checks that GET /health returns 200 with model loaded and runtime elasticity beta ~ -71.67."""
    res = client.get("/health")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert math.isclose(data["elasticity_coef"], -71.67, abs_tol=0.05)


def test_model_status_and_refresh_rbac(client: TestClient, admin_headers: dict, analyst_headers: dict):
    """Checks model status inspection for Analyst and verifies model refresh is Admin-only (403 for Analyst)."""
    # 1. Analyst can view model status
    status_res = client.get("/api/model/status", headers=analyst_headers)
    assert status_res.status_code == 200, status_res.text
    status_data = status_res.json()
    assert "primary_model" in status_data
    assert math.isclose(status_data["primary_model"]["elasticity_coefficient"], -71.67, abs_tol=0.05)

    # 2. Analyst cannot refresh model -> 403
    unauth_refresh = client.post("/api/model/refresh", headers=analyst_headers)
    assert unauth_refresh.status_code == 403

    # 3. Admin can refresh model -> 200
    admin_refresh = client.post("/api/model/refresh", headers=admin_headers)
    assert admin_refresh.status_code == 200


def test_removed_segments_route_returns_404(client: TestClient, admin_headers: dict):
    """Verifies that deprecated customer segmentation endpoint /api/segments returns 404 Not Found."""
    res = client.get("/api/segments", headers=admin_headers)
    assert res.status_code == 404
