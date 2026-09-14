from fastapi import FastAPI
import joblib
import pandas as pd
import os
from dotenv import load_dotenv
from google import genai
load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

app = FastAPI(title="PricePilot AI")

model = joblib.load("eda/pricepilot_model.pkl")

@app.get("/")
def home():
    return {"message": "PricePilot AI Backend is running!"}

@app.post("/predict")
def predict(data: dict):
    input_df = pd.DataFrame([data])

    input_df = input_df.reindex(
        columns=model.feature_names_in_,
        fill_value=0
    )

    prediction = model.predict(input_df)[0]

    return {
        "predicted_weekly_sales": float(prediction)
    }
@app.post("/recommend-price")
def recommend_price(data: dict):

    base_price = data["base_price"]
    predicted_sales = data["predicted_sales"]
    target_sales = data["target_sales"]

    if predicted_sales > target_sales * 1.2:
        recommended_price = base_price * 1.10
        action = "Increase price"

    elif predicted_sales < target_sales * 0.8:
        recommended_price = base_price * 0.90
        action = "Decrease price"

    else:
        recommended_price = base_price
        action = "Keep price"

    return {
        "recommended_price": round(recommended_price, 2),
        "action": action
    }
@app.get("/kpis")
def get_kpis():
    return {
        "model_r2_score": 0.9744,
        "model_mae": 1445.45,
        "model_rmse": 3657.06,
        "status": "Model performing well"
    }
@app.post("/ask")
def ask(data: dict):
    prompt = f"""
    You are PricePilot AI, a dynamic pricing assistant.

    Predicted weekly sales: {data["predicted_sales"]}
    Current price: {data["base_price"]}
    Target sales: {data["target_sales"]}
    Recommended price: {data["recommended_price"]}
    Action: {data["action"]}

    Explain this pricing recommendation in simple words.
    Mention why the price should be increased, decreased, or kept the same.
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return {
        "recommendation": response.text
    }
@app.get("/health")
def health():
    return {
        "app": "PricePilot AI",
        "status": "Backend is running"
    }