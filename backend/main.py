import pandas as pd
import joblib
from fastapi import FastAPI
from backend.db_connection import get_connection

app = FastAPI()
# Load trained demand prediction model
model = joblib.load("models/demand_model.pkl")

# Load ML-ready dataset
df = pd.read_csv("data/processed/ml_ready_data.csv")

print("Demand model loaded successfully!")
print("ML-ready dataset loaded successfully!")

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


@app.get("/api/products")
def get_products():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM products")

    products = cursor.fetchall()

    cursor.close()
    connection.close()

    return products
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

    # Convert ID columns
    input_data["Store ID"] = (
        input_data["Store ID"]
        .astype("category")
        .cat.codes
    )

    input_data["Product ID"] = (
        input_data["Product ID"]
        .astype("category")
        .cat.codes
    )

    # Convert boolean columns to integers
    input_data = input_data.astype(int)

    # Generate prediction
    prediction = model.predict(input_data)

    return {
        "status": "success",
        "row_id": row_id,
        "predicted_demand": float(prediction[0])
    }