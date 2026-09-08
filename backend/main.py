import pandas as pd
import joblib

from fastapi import FastAPI
from pydantic import BaseModel
from backend.db_connection import get_connection
from backend.pricing_optimizer import recommend_price
from backend.real_time_pricing import generate_pricing_recommendation


# =========================================================
# 1. Create FastAPI application
# =========================================================

app = FastAPI(
    title="PricePilot AI API",
    description="Dynamic Pricing Optimization and Revenue Intelligence System",
    version="1.0.0"
)


# =========================================================
# 2. Load trained demand prediction model
# =========================================================

model = joblib.load(
    "models/demand_model.pkl"
)


# =========================================================
# 3. Load ML-ready dataset
# =========================================================

df = pd.read_csv(
    "data/processed/ml_ready_data.csv"
)

print("Demand model loaded successfully!")
print("ML-ready dataset loaded successfully!")


# =========================================================
# 4. Root endpoint
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to PricePilot AI API"
    }


# =========================================================
# 5. Health check
# =========================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PricePilot AI backend"
    }


# =========================================================
# 6. Database check
# =========================================================

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


# =========================================================
# 7. Get products
# =========================================================

@app.get("/api/products")
def get_products():

    connection = get_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    cursor.execute(
        "SELECT * FROM products"
    )

    products = cursor.fetchall()

    cursor.close()
    connection.close()

    return products


# =========================================================
# 8. Demand Prediction
# =========================================================

@app.post("/api/predict")
def predict_demand(row_id: int = 0):

    # Check row ID
    if row_id < 0 or row_id >= len(df):

        return {
            "status": "error",
            "message": "Invalid row_id"
        }


    # Select input row
    input_data = df.drop(
        columns=["Demand", "Date"],
        errors="ignore"
    ).iloc[[row_id]].copy()


    # Convert Store ID
    input_data["Store ID"] = (
        input_data["Store ID"]
        .astype("category")
        .cat.codes
    )


    # Convert Product ID
    input_data["Product ID"] = (
        input_data["Product ID"]
        .astype("category")
        .cat.codes
    )


    # Convert Boolean columns
    input_data = input_data.astype(int)


    # Match features used during training
    if hasattr(model, "feature_names_in_"):

        input_data = input_data[
            model.feature_names_in_
        ]


    # Generate prediction
    prediction = model.predict(
        input_data
    )


    return {
        "status": "success",
        "row_id": row_id,
        "predicted_demand": float(
            prediction[0]
        )
    }
@app.post("/api/recommend-price")
def recommend_product_price(row_id: int = 0):

    # Check row ID
    if row_id < 0 or row_id >= len(df):
        return {
            "status": "error",
            "message": "Invalid row_id"
        }

    # Get original row
    original_row = df.iloc[row_id]

    # Prepare model input
    input_data = df.drop(
        columns=["Demand", "Date"],
        errors="ignore"
    ).iloc[[row_id]].copy()

    # Encode Store ID
    input_data["Store ID"] = (
        input_data["Store ID"]
        .astype("category")
        .cat.codes
    )

    # Encode Product ID
    input_data["Product ID"] = (
        input_data["Product ID"]
        .astype("category")
        .cat.codes
    )

    input_data = input_data.astype(int)

    # Predict demand
    predicted_demand = model.predict(input_data)[0]

    # Get pricing information
    current_price = float(original_row["Price"])

    competitor_price = float(
        original_row["Competitor Pricing"]
    )

    inventory_level = int(
        original_row["Inventory Level"]
    )

    # Generate recommended price
    recommended_price = recommend_price(
        current_price=current_price,
        competitor_price=competitor_price,
        predicted_demand=predicted_demand,
        inventory_level=inventory_level
    )

    return {
        "status": "success",
        "row_id": row_id,
        "current_price": current_price,
        "competitor_price": competitor_price,
        "inventory_level": inventory_level,
        "predicted_demand": round(
            float(predicted_demand), 2
        ),
        "recommended_price": recommended_price
    }

class PricingRequest(BaseModel):
    current_price: float
    competitor_price: float
    inventory_level: int
    predicted_demand: float

@app.post("/api/pricing")
def pricing_recommendation(request: PricingRequest):

    recommended_price = recommend_price(
        current_price=request.current_price,
        competitor_price=request.competitor_price,
        predicted_demand=request.predicted_demand,
        inventory_level=request.inventory_level
    )

    # Determine pricing action
    if recommended_price > request.current_price:
        action = "Increase Price"

    elif recommended_price < request.current_price:
        action = "Decrease Price"

    else:
        action = "Maintain Price"

    return {
        "status": "success",
        "current_price": request.current_price,
        "competitor_price": request.competitor_price,
        "inventory_level": request.inventory_level,
        "predicted_demand": request.predicted_demand,
        "recommended_price": recommended_price,
        "action": action
    }

@app.post("/api/real-time-pricing")
def real_time_pricing(
    row_id: int = 0,
    current_price: float = 70,
    competitor_price: float = 68,
    inventory_level: int = 150
):

    return generate_pricing_recommendation(
        row_id=row_id,
        current_price=current_price,
        competitor_price=competitor_price,
        inventory_level=inventory_level
    )