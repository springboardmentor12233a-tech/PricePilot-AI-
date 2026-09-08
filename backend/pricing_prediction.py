import pandas as pd
import joblib

from pricing_optimizer import recommend_price


# Load trained model
model = joblib.load("models/demand_model.pkl")

print("Demand model loaded successfully!")


# Load ML-ready dataset
df = pd.read_csv("data/processed/ml_ready_data.csv")

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)


# Prepare features
X = df.drop(
    columns=["Demand", "Date"],
    errors="ignore"
)

X["Store ID"] = (
    X["Store ID"]
    .astype("category")
    .cat.codes
)

X["Product ID"] = (
    X["Product ID"]
    .astype("category")
    .cat.codes
)

X = X.astype(int)


# Select one sample
row_id = 0

sample = X.iloc[[row_id]]


# Predict demand
predicted_demand = model.predict(sample)[0]


# Get original pricing information
current_price = df.iloc[row_id]["Price"]
competitor_price = df.iloc[row_id]["Competitor Pricing"]
inventory_level = df.iloc[row_id]["Inventory Level"]


# Calculate recommended price
recommended_price = recommend_price(
    current_price=current_price,
    competitor_price=competitor_price,
    predicted_demand=predicted_demand,
    inventory_level=inventory_level
)


print("\n========== PRICEPILOT AI ==========")

print("Current Price:", current_price)
print("Competitor Price:", competitor_price)
print("Inventory Level:", inventory_level)

print("Predicted Demand:", round(predicted_demand, 2))

print("Recommended Price:", recommended_price)

print("===================================")