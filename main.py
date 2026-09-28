from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from database import engine
import pricing_model
import demand_model
import competitor_analytics
import auth
import urllib.request
import json
import re
import os

app = FastAPI(title="PricePilot AI", version="0.1.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    try:
        n = pricing_model.train_price_model(engine)
        print(f"Pricing model initialized on {n} rows")
    except Exception as e:
        print(f"Pricing model initialization deferred: {e}")

    try:
        meta = demand_model.train_demand_model(engine)
        print(f"Demand model initialized ({meta.get('champion_model', 'Trained')})")
    except Exception as e:
        print(f"Demand model initialization deferred: {e}")


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


# ============================================================================
# Authentication & Role-Based Access Control (RBAC) Endpoints
# ============================================================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "business_user"


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/register")
def register(req: RegisterRequest):
    role = req.role if req.role in ["pricing_manager", "business_user"] else "business_user"
    clean_email = req.email.strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email address is required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed = auth.hash_password(req.password)

    try:
        with engine.connect() as conn:
            existing = conn.execute(
                text("SELECT id FROM users WHERE email = :email"), {"email": clean_email}
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="An account with this email already exists")

            insert_query = text("""
                INSERT INTO users (email, hashed_password, full_name, role)
                VALUES (:email, :pwd, :name, :role)
                RETURNING id, email, full_name, role, created_at
            """)
            row = conn.execute(
                insert_query,
                {"email": clean_email, "pwd": hashed, "name": req.full_name, "role": role}
            ).mappings().first()
            conn.commit()

        user_data = dict(row)
        if "created_at" in user_data and hasattr(user_data["created_at"], "isoformat"):
            user_data["created_at"] = user_data["created_at"].isoformat()

        token = auth.create_access_token({"sub": user_data["email"], "role": user_data["role"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {e}")


@app.post("/auth/login")
def login(req: LoginRequest):
    clean_email = req.email.strip().lower()

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, email, hashed_password, full_name, role, created_at FROM users WHERE email = :email"),
            {"email": clean_email}
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth.verify_password(req.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_data = {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
    }

    token = auth.create_access_token({"sub": user_data["email"], "role": user_data["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data,
    }


@app.get("/auth/me")
def get_current_profile(current_user: Dict[str, Any] = Depends(auth.get_current_user)):
    return current_user


# ============================================================================
# Product Catalog & Historical Metrics Endpoints
# ============================================================================

@app.get("/products")
def list_products():
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text("""
                    SELECT p.product_id, p.category, p.weight_g,
                           m.unit_price, m.qty_sold, m.total_price, m.product_score
                    FROM products p
                    LEFT JOIN LATERAL (
                        SELECT unit_price, qty_sold, total_price, product_score
                        FROM monthly_metrics
                        WHERE product_id = p.product_id
                        ORDER BY period_date DESC
                        LIMIT 1
                    ) m ON true
                    ORDER BY p.product_id
                """)
            ).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        try:
            with engine.connect() as conn:
                rows = conn.execute(
                    text("SELECT product_id, category FROM products ORDER BY product_id")
                ).mappings().all()
            return [dict(r) for r in rows]
        except Exception:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/products/{product_id}")
def get_product(product_id: str):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM products WHERE product_id = :pid"), {"pid": product_id}
        ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


@app.get("/products/{product_id}/history")
def get_product_history(product_id: str):
    with engine.connect() as conn:
        metrics = conn.execute(
            text("""
                SELECT period_date, qty_sold, unit_price, total_price, freight_price, product_score
                FROM monthly_metrics
                WHERE product_id = :pid
                ORDER BY period_date ASC
            """),
            {"pid": product_id}
        ).mappings().all()

        competitors = conn.execute(
            text("""
                SELECT period_date, competitor_num, price, score
                FROM competitor_prices
                WHERE product_id = :pid
                ORDER BY period_date ASC, competitor_num ASC
            """),
            {"pid": product_id}
        ).mappings().all()

    return {
        "product_id": product_id,
        "metrics": [dict(m) for m in metrics],
        "competitors": [dict(c) for c in competitors],
    }


@app.get("/products/{product_id}/price-recommendation")
def price_recommendation(product_id: str):
    result = pricing_model.predict_price(engine, product_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found or has no pricing history")
    return result


class PriceApprovalRequest(BaseModel):
    new_price: float
    notes: Optional[str] = None


@app.post("/products/{product_id}/apply-price")
def apply_price_update(
    product_id: str,
    payload: PriceApprovalRequest,
    current_user: Dict[str, Any] = Depends(auth.require_role(["pricing_manager"]))
):
    return {
        "status": "applied",
        "product_id": product_id,
        "new_price": payload.new_price,
        "approved_by": current_user["email"],
        "manager_name": current_user["full_name"],
        "notes": payload.notes or "Price approved via PricePilot AI Management Console",
    }


@app.get("/analytics/summary")
def get_summary():
    try:
        with engine.connect() as conn:
            prod_count = conn.execute(text("SELECT COUNT(*) FROM products")).scalar() or 0
            metrics_count = conn.execute(text("SELECT COUNT(*) FROM monthly_metrics")).scalar() or 0
            avg_price = conn.execute(text("SELECT AVG(unit_price) FROM monthly_metrics")).scalar() or 0
            total_revenue = conn.execute(text("SELECT SUM(total_price) FROM monthly_metrics")).scalar() or 0
        return {
            "total_products": prod_count,
            "total_metrics_records": metrics_count,
            "avg_unit_price": round(float(avg_price), 2),
            "total_revenue": round(float(total_revenue), 2),
        }
    except Exception as e:
        return {
            "total_products": 0,
            "total_metrics_records": 0,
            "avg_unit_price": 0.0,
            "total_revenue": 0.0,
            "error": str(e)
        }


# ============================================================================
# Demand Forecasting & Price Elasticity ML Endpoints
# ============================================================================

@app.get("/forecast/demand/{product_id}")
def get_demand_forecast(product_id: str, price: Optional[float] = None):
    result = demand_model.predict_demand(engine, product_id, custom_price=price)
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found or has no demand history")
    return result


# ============================================================================
# Competitor Intelligence Endpoints
# ============================================================================

@app.get("/analytics/competitors")
def get_competitor_insights():
    try:
        insights = competitor_analytics.get_all_competitor_insights(engine)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/competitors/{product_id}")
def get_competitor_detail(product_id: str):
    detail = competitor_analytics.get_product_competitor_detail(engine, product_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Product not found or has no competitor history")
    return detail


# ============================================================================
# Groq AI Copilot Chat Endpoints
# ============================================================================

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatPayload(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "openai/gpt-oss-20b"
    api_key: Optional[str] = None


@app.post("/api/chat")
def chat_proxy(payload: ChatPayload):
    key = payload.api_key or os.environ.get("GROQ_API_KEY", "")
    if key:
        key = re.sub(r'[\s\[\]\'"]+', '', key)

    if not key:
        raise HTTPException(status_code=400, detail="No Groq API key provided")

    clean_messages = [
        {"role": m.role, "content": m.content}
        for m in payload.messages
        if not m.content.startswith("⚠️") and not m.content.startswith("👋")
    ]

    first_user = next((i for i, m in enumerate(clean_messages) if m["role"] == "user"), 0)
    clean_messages = clean_messages[first_user:]

    system_prompt = {
        "role": "system",
        "content": "You are PricePilot AI Copilot, an intelligent dynamic pricing and revenue optimizer assistant. Provide concise, friendly, and structured markdown answers."
    }

    request_data = {
        "model": payload.model or "openai/gpt-oss-20b",
        "messages": [system_prompt] + clean_messages[-6:],
        "temperature": 0.6,
        "max_tokens": 800
    }

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(request_data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "PricePilot/1.0"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply, "model": payload.model}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"Groq API HTTP Error {e.code}: {err_body}")
        raise HTTPException(status_code=e.code, detail=err_body)
    except Exception as e:
        print(f"Groq API General Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/groq-models")
def get_groq_models(api_key: Optional[str] = None):
    key = api_key or os.environ.get("GROQ_API_KEY", "")
    if key:
        key = re.sub(r'[\s\[\]\'"]+', '', key)
    if not key:
        raise HTTPException(status_code=400, detail="No API key provided")

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/models",
        headers={
            "Authorization": f"Bearer {key}",
            "User-Agent": "Mozilla/5.0"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            models = [
                m["id"] for m in data.get("data", [])
                if not any(x in m["id"].lower() for x in ["whisper", "guard", "safeguard"])
            ]
            return {"models": models}
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=e.code, detail=e.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
