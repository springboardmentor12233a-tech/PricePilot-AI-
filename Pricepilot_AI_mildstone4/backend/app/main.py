from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.user import User
from app.services.auth_service import seed_default_accounts
from app.api.v3.auth_routes import router as auth_router
from app.api.v3.prediction_routes import router as pred_router
from app.api.v3.report_routes import router as report_router

# Initialize database schema & seed default demo accounts
Base.metadata.create_all(bind=engine)
try:
    with SessionLocal() as db:
        seed_default_accounts(db)
except Exception as e:
    print("Notice during seed:", e)

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Dynamic Pricing, Machine Learning Forecasting & BI API (Milestone 3)",
    version="3.0.0"
)

# Enable CORS for local dev and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(auth_router)
app.include_router(pred_router)
app.include_router(report_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs",
        "endpoints": {
            "auth": [
                "POST /api/auth/register",
                "POST /api/auth/login",
                "GET /api/auth/google",
                "GET /api/auth/google/callback",
                "GET /api/auth/github",
                "GET /api/auth/github/callback",
                "GET /api/auth/microsoft",
                "GET /api/auth/microsoft/callback",
                "GET /api/auth/me"
            ],
            "protected_apis": [
                "GET /api/products",
                "GET /api/catalogs",
                "GET /api/catalogs/{id}",
                "POST /api/price-optimization"
            ]
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "3.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
