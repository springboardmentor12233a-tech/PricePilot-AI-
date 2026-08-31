import pandas as pd
import joblib

from fastapi import FastAPI
from backend.db_connection import get_connection


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