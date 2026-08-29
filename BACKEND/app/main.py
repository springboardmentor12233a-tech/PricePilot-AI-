from fastapi import FastAPI

app = FastAPI(
    title="PricePilot AI",
    description="AI-powered product price prediction and tracking API",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "PricePilot AI Backend is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }