from fastapi import FastAPI
from backend.db_connection import get_connection

app = FastAPI(
    title="PricePilot AI API",
    description="Dynamic Pricing Optimization and Revenue Intelligence System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to PricePilot AI API"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PricePilot AI backend"
    }


@app.get("/api/database")
def database_check():

    connection = get_connection()

    if connection.is_connected():
        connection.close()

        return {
            "status": "connected",
            "database": "pricepilot_db"
        }

    return {
        "status": "disconnected"
    }