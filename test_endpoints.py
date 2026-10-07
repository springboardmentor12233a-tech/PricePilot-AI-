import urllib.request
import json

def test_api():
    base = "http://127.0.0.1:8000"
    try:
        with urllib.request.urlopen(f"{base}/health", timeout=3) as res:
            print("1. Health:", json.loads(res.read()))
    except Exception as e:
        print("\n" + "=" * 60)
        print(" [CONNECTION ERROR] Cannot connect to http://127.0.0.1:8000")
        print(" The FastAPI server is not currently running.")
        print()
        print(" To run this test:")
        print("   1. Open a separate terminal and start the server:")
        print("      python main.py")
        print("   2. Run this test script again:")
        print("      python test_endpoints.py")
        print()
        print(" Or run in-memory tests without starting the server:")
        print("      pytest test_api.py")
        print("=" * 60 + "\n")
        return
        
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

if __name__ == "__main__":
    test_api()
