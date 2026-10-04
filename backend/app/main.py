"""
PricePilot AI - Dynamic Pricing Optimization & Revenue Intelligence Backend.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.auth import init_db_and_seed_users
from app.ml.model_registry import registry
from app.routers import (
    auth,
    products,
    pricing,
    forecast,
    insight,
    alerts,
    reports,
    audit,
    models as model_router,
    eda,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables and seed demo accounts on startup
    init_db_and_seed_users()
    # Load elasticity model pickle and dataset snapshot into memory ONCE at startup
    registry.load()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered dynamic pricing optimization & revenue intelligence system for electronics.",
    version="0.3.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """
    Health check endpoint verifying API service readiness and loaded model metadata.
    """
    meta = registry.get_metadata() if registry.initialized else {}
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "sqlite_ready",
        "model_loaded": registry.initialized,
        "elasticity_coef": meta.get("elasticity_coefficient"),
        "r_squared": meta.get("r_squared"),
    }


# Register feature routers (no customer segmentation router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(pricing.router)
app.include_router(forecast.router)
app.include_router(insight.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(model_router.router)
app.include_router(eda.router)
