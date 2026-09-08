from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.competitors import router as competitors_router
from app.routes.organizations import router as organizations_router
from app.routes.pricing import router as pricing_router
from app.routes.products import router as products_router
from app.routes.sales import router as sales_router
from app.routes.users import router as users_router

app = FastAPI(
    title="PricePilot AI",
    description="AI-powered product price prediction and tracking API backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(organizations_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(competitors_router, prefix="/api/v1")
app.include_router(pricing_router, prefix="/api/v1")
app.include_router(sales_router, prefix="/api/v1")


@app.get("/")
def home():
    return {
        "message": "PricePilot AI Backend is running",
        "status": "success",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PricePilot AI Backend",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
    )