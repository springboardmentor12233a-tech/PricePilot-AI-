from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from database import engine
import pricing_model

app = FastAPI(title="PricePilot AI", version="0.1.0")


@app.on_event("startup")
def startup():
    n = pricing_model.train_price_model(engine)
    print(f"Price model trained on {n} rows")


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/products")
def list_products():
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT product_id, category FROM products ORDER BY product_id")
        ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/products/{product_id}")
def get_product(product_id: str):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM products WHERE product_id = :pid"), {"pid": product_id}
        ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


@app.get("/products/{product_id}/price-recommendation")
def price_recommendation(product_id: str):
    result = pricing_model.predict_price(engine, product_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found or has no pricing history")
    return result
