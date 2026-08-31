import pandas as pd
import joblib

# Load trained model
model = joblib.load(
    "models/demand_model.pkl"
)

print("Model loaded successfully!")


# Load ML-ready dataset
df = pd.read_csv(
    "data/processed/ml_ready_data.csv"
)

print("Dataset loaded successfully!")
print("Shape:", df.shape)


# Separate target
X = df.drop(
    columns=["Demand", "Date"],
    errors="ignore"
)


# Convert ID columns
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


# Convert boolean columns
X = X.astype(int)


# Select one sample
sample = X.iloc[[0]]


# Predict demand
prediction = model.predict(sample)


print("\n===== DEMAND PREDICTION =====")

print(
    "Predicted Demand:",
    prediction[0]
)
print("\nPrediction features:")
print(X.columns.tolist())
print("\nNumber of features:", X.shape[1])