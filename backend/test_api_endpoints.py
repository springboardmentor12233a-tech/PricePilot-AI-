"""
End-to-End API verification tests for PricePilot AI.
Tests authentication, RBAC (401/403 guards), full CRUD, predictions, forecasts,
reports, password reset, and EDA.
"""

import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("STARTING PRICEPILOT AI API VERIFICATION TESTS")
    print("=" * 60)
    passed = 0
    total = 0

    def assert_eq(actual, expected, msg):
        nonlocal passed, total
        total += 1
        if actual == expected:
            print(f"  [PASS] {msg}")
            passed += 1
        else:
            print(f"  [FAIL] {msg} -> Expected {expected}, got {actual}")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert_eq(res.status_code, 200, "Health check responds with 200")
    h_data = res.json()
    assert_eq(h_data["model_loaded"], True, "Elasticity model loaded in memory")
    assert_eq(round(h_data["elasticity_coef"], 2), -71.67, "Elasticity coefficient beta is ~ -71.67")

    # 2. Login as Admin
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@pricepilot.ai", "password": "Admin@123"})
    assert_eq(res.status_code, 200, "Admin login succeeds")
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Login as Business Analyst
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "analyst@pricepilot.ai", "password": "Analyst@123"})
    assert_eq(res.status_code, 200, "Business Analyst login succeeds")
    analyst_token = res.json()["access_token"]
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # 4. RBAC 401 test - no token on protected routes
    res = requests.get(f"{BASE_URL}/api/products")
    assert_eq(res.status_code, 401, "GET /api/products without token rejects with 401 Unauthorized")

    res = requests.get(f"{BASE_URL}/api/audit-logs")
    assert_eq(res.status_code, 401, "GET /api/audit-logs without token rejects with 401 Unauthorized")

    # 5. RBAC 403 test - Analyst attempting Admin-only actions
    res = requests.get(f"{BASE_URL}/api/audit-logs", headers=analyst_headers)
    assert_eq(res.status_code, 403, "Analyst attempting GET /api/audit-logs rejects with 403 Forbidden")

    res = requests.get(f"{BASE_URL}/api/auth/users", headers=analyst_headers)
    assert_eq(res.status_code, 403, "Analyst attempting GET /api/auth/users rejects with 403 Forbidden")

    res = requests.post(f"{BASE_URL}/api/model/refresh", headers=analyst_headers)
    assert_eq(res.status_code, 403, "Analyst attempting POST /api/model/refresh rejects with 403 Forbidden")

    res = requests.delete(f"{BASE_URL}/api/products/prod_001", headers=analyst_headers)
    assert_eq(res.status_code, 403, "Analyst attempting DELETE /api/products rejects with 403 Forbidden")

    # 6. Admin permitted actions
    res = requests.get(f"{BASE_URL}/api/audit-logs", headers=admin_headers)
    assert_eq(res.status_code, 200, "Admin permitted GET /api/audit-logs returns 200")

    res = requests.get(f"{BASE_URL}/api/auth/users", headers=admin_headers)
    assert_eq(res.status_code, 200, "Admin permitted GET /api/auth/users returns 200")

    # 7. Products listing for both roles
    res = requests.get(f"{BASE_URL}/api/products", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Analyst can view products catalog")
    prods = res.json()
    assert_eq(len(prods) >= 8, True, "Products catalog contains >= 8 SKUs")

    # 8. Admin Product CRUD
    test_prod = {
        "id": "prod_test_99",
        "name": "Bose SoundLink Flex Bluetooth Speaker",
        "category": "Audio",
        "current_price": 149.00,
        "cost_price": 95.00,
        "competitor_price": 139.00,
        "stock_level": 45,
        "stock_status": "In Stock"
    }
    res = requests.post(f"{BASE_URL}/api/products", headers=admin_headers, json=test_prod)
    assert_eq(res.status_code, 201, "Admin creates new product with 201 Created")

    # Update product
    res = requests.put(f"{BASE_URL}/api/products/prod_test_99", headers=admin_headers, json={"current_price": 145.00})
    assert_eq(res.status_code, 200, "Admin updates product price to 145.00")

    # Delete product
    res = requests.delete(f"{BASE_URL}/api/products/prod_test_99", headers=admin_headers)
    assert_eq(res.status_code, 200, "Admin deletes product with 200 OK")

    # 9. Pricing Sweep & Simulation
    res = requests.get(f"{BASE_URL}/api/pricing/sweep/prod_001", headers=analyst_headers)
    assert_eq(res.status_code, 200, "GET /api/pricing/sweep/prod_001 succeeds")
    sweep = res.json()
    assert_eq(len(sweep["sweep"]) > 10, True, "Pricing sweep returns candidate price points")

    res = requests.post(f"{BASE_URL}/api/pricing/optimize", headers=analyst_headers, json={"product_id": "prod_001", "custom_price": 319.00})
    assert_eq(res.status_code, 200, "POST /api/pricing/optimize custom price simulation succeeds")

    # 10. Demand Forecast with horizon toggling
    res = requests.get(f"{BASE_URL}/api/forecast/prod_001?horizon=7d", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Demand forecast 7d horizon succeeds")
    fc_7d = res.json()
    assert_eq(fc_7d["horizon_days"], 7, "Horizon days is 7")

    res = requests.get(f"{BASE_URL}/api/forecast/prod_001?horizon=30d", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Demand forecast 30d horizon succeeds")
    fc_30d = res.json()
    assert_eq(fc_30d["horizon_days"], 30, "Horizon days is 30")
    assert_eq(round(fc_30d["r_squared"], 2), 0.33, "Confidence derived from real R² ~ 0.33")

    # 11. Model Status
    res = requests.get(f"{BASE_URL}/api/model/status", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Model status endpoint responds")
    m_status = res.json()
    assert_eq(round(m_status["primary_model"]["elasticity_coefficient"], 2), -71.67, "Status shows real elasticity beta ~ -71.67")

    # 12. Password Reset Flow
    res = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "analyst@pricepilot.ai"})
    assert_eq(res.status_code, 200, "Forgot password endpoint generates token")
    reset_token = res.json().get("reset_token")
    assert_eq(bool(reset_token), True, "Reset token generated successfully")

    # Test reset password with new password
    res = requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": reset_token, "new_password": "Analyst@New456"})
    assert_eq(res.status_code, 200, "Reset password with token succeeds")

    # Verify login with new password
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "analyst@pricepilot.ai", "password": "Analyst@New456"})
    assert_eq(res.status_code, 200, "Login with new reset password succeeds")

    # Reset it back to Analyst@123 for consistency
    res = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "analyst@pricepilot.ai"})
    r_token = res.json()["reset_token"]
    requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": r_token, "new_password": "Analyst@123"})

    # 13. Reports Download
    res = requests.get(f"{BASE_URL}/api/reports/summary?format=pdf", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Download PDF report succeeds")
    assert_eq(res.headers.get("content-type"), "application/pdf", "PDF report has application/pdf content type")

    res = requests.get(f"{BASE_URL}/api/reports/summary?format=csv", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Download CSV report succeeds")
    assert_eq("text/csv" in res.headers.get("content-type", ""), True, "CSV report has text/csv content type")

    # 14. EDA Visualizations Data
    res = requests.get(f"{BASE_URL}/api/eda/data", headers=analyst_headers)
    assert_eq(res.status_code, 200, "GET /api/eda/data succeeds")
    eda = res.json()
    assert_eq("category_revenue" in eda and "price_gap_histogram" in eda and "price_vs_quantity_scatter" in eda, True, "EDA data contains all required visualization datasets")

    # 15. Verify segments route is removed (must return 404)
    res = requests.get(f"{BASE_URL}/api/segments", headers=admin_headers)
    assert_eq(res.status_code, 404, "/api/segments is properly removed (returns 404 Not Found)")

    # 16. Single Product Price Comparison PDF Download
    res = requests.get(f"{BASE_URL}/api/reports/price-comparison/prod_001", headers=analyst_headers)
    assert_eq(res.status_code, 200, "Download price comparison PDF succeeds")
    assert_eq(res.headers.get("content-type"), "application/pdf", "Price comparison has application/pdf content type")
    assert_eq(len(res.content) > 10000, True, "Price comparison PDF content size is > 10KB")

    print("=" * 60)
    print(f"VERIFICATION SUMMARY: {passed}/{total} TESTS PASSED!")
    print("=" * 60)
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
