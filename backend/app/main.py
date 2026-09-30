"""
PricePilot AI — FastAPI Backend Application
============================================
REST API layer connecting the PricePilot ML & analytics engines to web frontends.
"""

import logging
import sys
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.routes import (
    alerts,
    analytics,
    auth,
    chat,
    competitor,
    dashboard,
    demand,
    health,
    insights,
    pricing,
    products,
    reports,
    revenue,
    users,
)
from backend.app.auth import require_business_user
from backend.app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("pricepilot_backend")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Enterprise-grade REST API backend for PricePilot AI. "
        "Provides model-based price clearing recommendations, multi-horizon demand forecasting, "
        "revenue optimization, digital-channel/peer market comparisons, and Gemini LLM business insights."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure Cross-Origin Resource Sharing (CORS)
log.info("Configuring CORS with allowed origins: %s", settings.ALLOWED_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred while processing request.", "error": str(exc)},
    )


# Register API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(chat.router, prefix=settings.API_PREFIX)
business_api_guard = [Depends(require_business_user)]
app.include_router(pricing.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)
app.include_router(products.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)
app.include_router(demand.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)

app.include_router(revenue.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)
app.include_router(competitor.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)
app.include_router(insights.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX, dependencies=business_api_guard)



@app.get("/")
def root_redirect():
    """Root endpoint providing service information and links."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs",
        "api_health": f"{settings.API_PREFIX}/health",
    }


if __name__ == "__main__":
    import uvicorn

    log.info("Starting PricePilot AI Backend on %s:%d...", settings.HOST, settings.PORT)
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
