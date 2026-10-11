"""
Entry point of the backend. This is the file uvicorn runs.

Run it with:
    uvicorn app.main:app --reload

`--reload` watches for file changes and restarts automatically — use this
in development only, never in a real deployment.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import (
    pricing,
    forecasting,
    competitor,
    revenue,
    dashboard,
    auth,
    insights,
    ai,            # NEW: chatbot  -> POST /api/v1/ai/ask
    report_export, # NEW: BI report -> GET  /api/v1/reports/download
    products,      # REST catalog -> GET /products, GET /products/{product_id}
)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered dynamic pricing optimization & revenue intelligence system",
    version="0.1.0",
)

# CORS: without this, your Next.js frontend (running on a different port,
# e.g. localhost:3000) will be BLOCKED by the browser from calling this API
# (running on localhost:8000). This is a browser security rule, not a
# FastAPI quirk — every full-stack project with separate frontend/backend
# ports needs this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # NEW: lets the browser read the filename sent with report downloads
    expose_headers=["Content-Disposition"],
)


@app.get("/health")
def health_check():
    """
    Simple endpoint to confirm the API is alive. This is the FIRST thing
    you should test after running the server, and later, the first thing
    Docker healthchecks will hit.
    """
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}


app.include_router(auth.router)
app.include_router(pricing.router)
app.include_router(forecasting.router)
app.include_router(competitor.router)
app.include_router(revenue.router)
app.include_router(dashboard.router)
app.include_router(insights.router)
app.include_router(ai.router)             # NEW
app.include_router(report_export.router)  # NEW
app.include_router(products.router)       # Products catalog endpoints