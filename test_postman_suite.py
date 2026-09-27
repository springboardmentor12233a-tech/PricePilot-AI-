import sys
import json
sys.path.insert(0, r"C:\Users\jojo\.gemini\antigravity\scratch\git_repo\Milestone3\backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 80)
print("  PricePilot AI - Postman Collection Automated Test Runner")
print("  Testing: JWT Authentication & Product Information Operations")
print("=" * 80)

passed = 0
failed = 0

def assert_test(name, condition, details=""):
    global passed, failed
    if condition:
        passed += 1
        print(f" [PASS] {name} {details}")
    else:
        failed += 1
        print(f" [FAIL] {name} {details}")

# 1. JWT Authentication: Register
reg_res = client.post("/api/auth/register", json={
    "name": "Yuvraj Patil",
    "email": "yuvraj_postman@pricepilot.ai",
    "password": "SecurePass@123",
    "role": "admin"
})
assert_test("POST /api/auth/register", reg_res.status_code == 201, f"(Status: {reg_res.status_code})")
jwt_token = reg_res.json().get("access_token")
assert_test("JWT Token Issued on Register", bool(jwt_token), f"(Token: {jwt_token[:30]}...)")

# 2. JWT Authentication: Admin Login
admin_login = client.post("/api/auth/login", json={
    "email": "admin@pricepilot.ai",
    "password": "Admin@123"
})
assert_test("POST /api/auth/login (Admin)", admin_login.status_code == 200, f"(Role: {admin_login.json()['user']['role']})")
admin_jwt = admin_login.json()["access_token"]

# 3. JWT Authentication: Analyst Login
analyst_login = client.post("/api/auth/login", json={
    "email": "analyst@pricepilot.ai",
    "password": "Analyst@123"
})
assert_test("POST /api/auth/login (Analyst)", analyst_login.status_code == 200, f"(Role: {analyst_login.json()['user']['role']})")
analyst_jwt = analyst_login.json()["access_token"]

# 4. JWT Authentication: User Login
user_login = client.post("/api/auth/login", json={
    "email": "user@pricepilot.ai",
    "password": "User@123"
})
assert_test("POST /api/auth/login (User)", user_login.status_code == 200, f"(Role: {user_login.json()['user']['role']})")
user_jwt = user_login.json()["access_token"]

# 5. JWT Authentication: Get Profile
me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("GET /api/auth/me (Protected with Admin JWT)", me_res.status_code == 200, f"(User: {me_res.json()['email']})")

# 6. JWT Authentication: Unauthorized without token
unauth_res = client.get("/api/auth/me")
assert_test("GET /api/auth/me (Missing Token -> 401 Unauthorized)", unauth_res.status_code == 401)

# 7. Product Information: List all products
prod_res = client.get("/api/products", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("GET /api/products (List All Products)", prod_res.status_code == 200, f"(Count: {prod_res.json()['count']}, Rev: ${prod_res.json()['total_revenue']/1e6:.1f}M)")

# 8. Product Information: Filter by Category
cat_filter_res = client.get("/api/products?category=Electronics", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("GET /api/products?category=Electronics", cat_filter_res.status_code == 200, f"(Count: {cat_filter_res.json()['count']})")

# 9. Product Information: Get Single Product Detailed Information (8+ parameters)
detail_res = client.get("/api/products/1", headers={"Authorization": f"Bearer {admin_jwt}"})
p1 = detail_res.json()
has_all_params = all(k in p1 for k in ["name", "category", "price", "cost", "competitor_avg", "margin_pct", "daily_demand", "stock", "sales_channel", "rating", "status"])
assert_test("GET /api/products/1 (Complete Product Information)", detail_res.status_code == 200 and has_all_params, f"({p1['name']} - Price: ${p1['price']}, Margin: {p1['margin_pct']}%)")

# 10. Product Information: Add New Product (Admin Role)
new_prod_res = client.post("/api/products", headers={"Authorization": f"Bearer {admin_jwt}"}, json={
    "name": "SmartWatch Apex Ultra",
    "category": "Electronics",
    "price": 299.99,
    "cost": 145.00,
    "competitor_1": 310.00,
    "competitor_2": 305.00,
    "competitor_3": 295.00,
    "daily_demand": 25.0,
    "stock": 600,
    "sales_channel": "Direct Web",
    "rating": 4.8,
    "status": "Optimal"
})
assert_test("POST /api/products (Add New Product - Admin Only)", new_prod_res.status_code == 201, f"(Created ID: {new_prod_res.json().get('id')}, Margin: {new_prod_res.json().get('margin_pct')}%)")

# 11. RBAC Test: Non-admin (User) attempts to Add Product -> Expect 403 Forbidden
forbidden_res = client.post("/api/products", headers={"Authorization": f"Bearer {user_jwt}"}, json={
    "name": "Hacker Gadget",
    "category": "Electronics",
    "price": 99.99,
    "cost": 40.00
})
assert_test("POST /api/products (RBAC Guard - User Blocked -> 403 Forbidden)", forbidden_res.status_code == 403, f"(Detail: {forbidden_res.json().get('detail')})")

# 12. Product Information: Update Product (Admin Role)
update_res = client.put("/api/products/1", headers={"Authorization": f"Bearer {admin_jwt}"}, json={
    "price": 249.99,
    "rating": 4.9,
    "status": "Optimal"
})
assert_test("PUT /api/products/1 (Update Product - Admin Only)", update_res.status_code == 200, f"(New Price: ${update_res.json().get('price')})")

# 13. Product Information: Delete Product (Admin Role)
del_res = client.delete("/api/products/15", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("DELETE /api/products/15 (Delete Product - Admin Only)", del_res.status_code == 200, f"(Remaining: {del_res.json().get('remaining_count')})")

# 14. Product Information: Unauthorized without JWT
unauth_prod = client.get("/api/products")
assert_test("GET /api/products (Missing JWT -> 401 Unauthorized)", unauth_prod.status_code == 401)

# 15. Catalogs: List Enterprise Catalogs
cats_res = client.get("/api/catalogs", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("GET /api/catalogs (List Catalogs)", cats_res.status_code == 200, f"(Count: {len(cats_res.json()['catalogs'])})")

# 16. Catalogs: Detail by ID
cat_det = client.get("/api/catalogs/cat-electronics", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("GET /api/catalogs/cat-electronics (Catalog Details & Elasticity)", cat_det.status_code == 200, f"(Elasticity: {cat_det.json()['metrics']['price_elasticity']})")

# 17. Price Optimization: LightGBM Regressor
opt_res = client.post("/api/price-optimization?product_id=2", headers={"Authorization": f"Bearer {admin_jwt}"})
assert_test("POST /api/price-optimization (LightGBM Optimization)", opt_res.status_code == 200, f"(Optimal Price: ${opt_res.json()['recommended_price']}, Conf: {opt_res.json()['confidence_score']*100:.1f}%)")

# 18. OAuth 2.0: Google Sign-In Callback
goog_res = client.get("/api/auth/google/callback?email=yuvraj.google@gmail.com&name=Yuvraj%20Google")
assert_test("GET /api/auth/google/callback (Google OAuth JWT)", goog_res.status_code == 200 and "access_token" in goog_res.json())

# 19. OAuth 2.0: GitHub Sign-In Callback
gh_res = client.get("/api/auth/github/callback?username=yuvraj_github&email=yuvraj@github.auth")
assert_test("GET /api/auth/github/callback (GitHub OAuth JWT)", gh_res.status_code == 200 and "access_token" in gh_res.json())

# 20. OAuth 2.0: Microsoft Sign-In Callback
ms_res = client.get("/api/auth/microsoft/callback?email=yuvraj@outlook.com&name=Yuvraj%20MS")
assert_test("GET /api/auth/microsoft/callback (Microsoft OAuth JWT)", ms_res.status_code == 200 and "access_token" in ms_res.json())

print("=" * 80)
print(f"  Test Results: {passed} PASSED | {failed} FAILED | Total: {passed + failed}")
print("=" * 80)
