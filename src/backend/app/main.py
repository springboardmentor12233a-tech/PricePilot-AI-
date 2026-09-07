from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import product, auth

app = FastAPI(title="PricePilot AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(product.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PricePilot AI Backend"}