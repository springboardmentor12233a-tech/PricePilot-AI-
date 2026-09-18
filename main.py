from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine
import pricing_model

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
        print(f"Price model trained on {n} rows")
    except Exception as e:
        print(f"Model initialization skipped or deferred: {e}")


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


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
        # Fallback to basic list or error
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


from pydantic import BaseModel
from typing import List, Optional
import urllib.request
import json
import re

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
        key = re.sub(r'[\[\]"\'\s]', '', key)
    
    if not key:
        raise HTTPException(status_code=400, detail="No Groq API key provided")
    
    clean_messages = [
        {"role": m.role, "content": m.content}
        for m in payload.messages
        if not m.content.startswith("⚠️") and not m.content.startswith("👋")
    ]
    
    # Ensure starting with user message
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
        key = re.sub(r'[\[\]"\'\s]', '', key)
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



