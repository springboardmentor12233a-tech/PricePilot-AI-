"""
Entry point of the backend. This is the file uvicorn runs.

Run it with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import pricing

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered dynamic pricing optimization & revenue intelligence system",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}


app.include_router(pricing.router)


# NOTE: more feature routers (auth, products, forecasting...) will be
# added here the same way as we build each module.