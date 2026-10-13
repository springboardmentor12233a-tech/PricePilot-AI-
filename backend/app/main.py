import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.db import Base, engine
from app.routes import (
    ai, alerts, audit, auth, chat, competitors, customers, dashboard,
    eda, forecast, models_routes, pricing, products, reports, revenue, users,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pricepilot")

app = FastAPI(
    title="PricePilot AI",
    description="Dynamic Pricing Optimization & Revenue Intelligence System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "An internal error occurred. Please try again."})


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(dashboard.router)
app.include_router(pricing.router)
app.include_router(forecast.router)
app.include_router(competitors.router)
app.include_router(customers.router)
app.include_router(revenue.router)
app.include_router(ai.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(models_routes.router)
app.include_router(chat.router)
app.include_router(eda.router)
app.include_router(audit.router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
