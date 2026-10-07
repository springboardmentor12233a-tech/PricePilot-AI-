import urllib.request
import json
import sys

def test_api():
    base = "http://127.0.0.1:8000"
    is_live = False
    try:
        with urllib.request.urlopen(f"{base}/health", timeout=1) as res:
            health_data = json.loads(res.read())
            print("1. Health (Live Server):", health_data)
            is_live = True
    except Exception:
        print("[Notice] Live server not detected on http://127.0.0.1:8000.")
        print("[Notice] Seamlessly running tests in-memory via FastAPI TestClient...\n")

    if is_live:
        # Run via live HTTP
        login_data = json.dumps({"email": "manager@pricepilot.ai", "password": "Password123!"}).encode("utf-8")
        req = urllib.request.Request(f"{base}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as res:
            login_res = json.loads(res.read())
            token = login_res["access_token"]
            user = login_res["user"]
            print(f"2. Login success: {user['email']} | Role: {user['role']}")
            
        req_me = urllib.request.Request(f"{base}/auth/me", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req_me) as res:
            me = json.loads(res.read())
            print(f"3. Auth /me verified: {me['full_name']} | Role: {me['role']}")
            
        with urllib.request.urlopen(f"{base}/forecast/demand/bed1") as res:
            fc = json.loads(res.read())
            print(f"4. Demand Forecast (bed1): {len(fc['horizons'])} horizons | Elasticity: {fc['elasticity']['type']} ({fc['elasticity']['coefficient']}) | 30d qty: {fc['horizons']['30_days']['qty']}")
            
        with urllib.request.urlopen(f"{base}/analytics/competitors") as res:
            comp_all = json.loads(res.read())
            print(f"5. Competitor List: {len(comp_all)} products loaded.")
            p0 = comp_all[0]
            print(f"   First product: {p0['product_id']} | Price Index: {p0['price_index']}% | Stance: {p0['market_stance']} | Tag: {p0['opportunity']['tag']}")
            
        with urllib.request.urlopen(f"{base}/analytics/competitors/bed1") as res:
            detail = json.loads(res.read())
            print(f"6. Competitor Detail (bed1): {len(detail['competitors'])} rivals, {len(detail['historical_trend'])} history periods.")
            for c in detail["competitors"]:
                print(f"   - {c['competitor_id']}: ${c['price']} (diff: ${c['price_difference']}, score: {c['score']})")
        print("\nAll 6 live API tests passed successfully!")
    else:
        # Run via TestClient in-memory (no server process required)
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        
        # 1. Health
        res = client.get("/health")
        assert res.status_code == 200
        print("1. Health (In-Memory):", res.json())
        
        # 2. Login
        res = client.post("/auth/login", json={"email": "manager@pricepilot.ai", "password": "Password123!"})
        assert res.status_code == 200
        login_res = res.json()
        token = login_res["access_token"]
        user = login_res["user"]
        print(f"2. Login success: {user['email']} | Role: {user['role']}")
        
        # 3. /auth/me
        res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        me = res.json()
        print(f"3. Auth /me verified: {me['full_name']} | Role: {me['role']}")
        
        # 4. Demand forecast
        res = client.get("/forecast/demand/bed1")
        assert res.status_code == 200
        fc = res.json()
        print(f"4. Demand Forecast (bed1): {len(fc['horizons'])} horizons | Elasticity: {fc['elasticity']['type']} ({fc['elasticity']['coefficient']}) | 30d qty: {fc['horizons']['30_days']['qty']}")
        
        # 5. Competitor list
        res = client.get("/analytics/competitors")
        assert res.status_code == 200
        comp_all = res.json()
        print(f"5. Competitor List: {len(comp_all)} products loaded.")
        p0 = comp_all[0]
        print(f"   First product: {p0['product_id']} | Price Index: {p0['price_index']}% | Stance: {p0['market_stance']} | Tag: {p0['opportunity']['tag']}")
        
        # 6. Competitor detail
        res = client.get("/analytics/competitors/bed1")
        assert res.status_code == 200
        detail = res.json()
        print(f"6. Competitor Detail (bed1): {len(detail['competitors'])} rivals, {len(detail['historical_trend'])} history periods.")
        for c in detail["competitors"]:
            print(f"   - {c['competitor_id']}: ${c['price']} (diff: ${c['price_difference']}, score: {c['score']})")
        print("\nAll 6 in-memory API tests passed successfully!")

if __name__ == "__main__":
    test_api()
