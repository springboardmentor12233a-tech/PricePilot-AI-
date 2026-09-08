import pandas as pd
import joblib

from backend.pricing_optimizer import recommend_price


# Load trained model
model = joblib.load("models/demand_model.pkl")

# Load ML-ready dataset
df = pd.read_csv("data/processed/ml_ready_data.csv")

print("Model loaded successfully!")
print("Dataset loaded successfully!")


def generate_pricing_recommendation(
    row_id,
    current_price,
    competitor_price,
    inventory_level
):

    if row_id < 0 or row_id >= len(df):
        return {
            "status": "error",
            "message": "Invalid row_id"
        }

    # Copy a real dataset row
    row = df.iloc[row_id].copy()

    # Update real-time values
    row["Price"] = current_price
    row["Competitor Pricing"] = competitor_price
    row["Inventory Level"] = inventory_level

    # Update engineered pricing features
    row["Price Difference"] = (
        current_price - competitor_price
    )

    row["Price Ratio"] = (
        current_price / competitor_price
        if competitor_price != 0
        else 0
    )

    # Prepare model input
    input_data = row.drop(
        labels=["Demand", "Date"],
        errors="ignore"
    ).to_frame().T

    # Encode IDs in the same way as model training
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

    input_data = input_data.astype(int)

    # Predict demand
    predicted_demand = model.predict(input_data)[0]

    # Calculate recommended price
    recommended_price = recommend_price(
        current_price=current_price,
        competitor_price=competitor_price,
        predicted_demand=predicted_demand,
        inventory_level=inventory_level
    )

    # Determine action
    if recommended_price > current_price:
        action = "Increase Price"

    elif recommended_price < current_price:
        action = "Decrease Price"

    else:
        action = "Maintain Price"

    return {
        "status": "success",
        "current_price": current_price,
        "competitor_price": competitor_price,
        "inventory_level": inventory_level,
        "predicted_demand": round(
            float(predicted_demand), 2
        ),
        "recommended_price": recommended_price,
        "action": action
    }


# Test
if __name__ == "__main__":

    result = generate_pricing_recommendation(
        row_id=0,
        current_price=70,
        competitor_price=68,
        inventory_level=150
    )

    print("\n========== PRICEPILOT AI ==========")

    for key, value in result.items():
        print(f"{key}: {value}")

    print("===================================")