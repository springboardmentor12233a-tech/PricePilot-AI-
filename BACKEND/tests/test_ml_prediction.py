import joblib
import pandas as pd
from pathlib import Path


# ============================================================
# MODEL PATH
# ============================================================

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "saved_models"
    / "pricepilot_xgboost_model.pkl"
)


# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 70)
print("PRICEPILOT AI - DIRECT ML PREDICTION TEST")
print("=" * 70)

artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
preprocessor = artifact["preprocessor"]
features = artifact["features"]

print("\nModel:", artifact["model_name"])
print("Version:", artifact["version"])
print("Expected features:", len(features))


# ============================================================
# TEST INPUT
# ============================================================

test_data = {
    "Store ID": "S001",
    "Product ID": "P001",
    "Category": "Groceries",
    "Region": "North",
    "Inventory Level": 150,
    "Units Ordered": 120,
    "Price": 599,
    "Discount": 15,
    "Weather Condition": "Sunny",
    "Promotion": 1,
    "Competitor Pricing": 579,
    "Seasonality": "Summer",
    "Epidemic": 0,
    "Year": 2024,
    "Month": 1,
    "Day": 15,
    "Price Difference": 20,
    "Relative Price Difference": 20 / 579,
    "Price Position": "Above Competitor",
    "Day of Week": 0,
    "Quarter": 1,
    "Week of Year": 3,
    "Month Sin": 0.5,
    "Month Cos": 0.8660,
    "DayOfWeek Sin": 0.0,
    "DayOfWeek Cos": 1.0
}


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame([test_data])

print("\nInput shape:", df.shape)

print("\nChecking features...")

missing_features = [
    feature for feature in features
    if feature not in df.columns
]

extra_features = [
    column for column in df.columns
    if column not in features
]

if missing_features:
    print("\nMissing features:")
    for feature in missing_features:
        print("-", feature)

    raise ValueError("Required features are missing.")

if extra_features:
    print("\nExtra features:")
    for feature in extra_features:
        print("-", feature)

# Ensure exact feature order
df = df[features]

print("Feature validation: PASSED")


# ============================================================
# PREPROCESS
# ============================================================

print("\nApplying saved preprocessor...")

X_processed = preprocessor.transform(df)

print("Raw feature shape:", df.shape)
print("Processed feature shape:", X_processed.shape)


# ============================================================
# PREDICTION
# ============================================================

print("\nRunning XGBoost prediction...")

prediction = model.predict(X_processed)

predicted_demand = float(prediction[0])


# ============================================================
# RESULT
# ============================================================

print("\n" + "=" * 70)
print("PREDICTION RESULT")
print("=" * 70)

print(f"Predicted Demand: {predicted_demand:.2f} units")

print("\n" + "=" * 70)
print("ML INFERENCE TEST PASSED")
print("=" * 70)