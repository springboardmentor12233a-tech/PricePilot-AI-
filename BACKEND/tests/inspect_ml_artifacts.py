import joblib
from pathlib import Path

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "saved_models"
    / "pricepilot_xgboost_model.pkl"
)

artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
preprocessor = artifact["preprocessor"]

print("=" * 70)
print("PRICEPILOT ML ARTIFACT INSPECTION")
print("=" * 70)

print("\nModel:")
print(model)

print("\nModel type:")
print(type(model))

print("\nModel parameters:")
print(model.get_params())

print("\nChecking fitted status...")

try:
    booster = model.get_booster()

    print("\nXGBoost Booster loaded successfully.")
    print("Number of trees:", len(booster.get_dump()))

except Exception as e:
    print("\nXGBoost Booster is NOT loaded/fitted.")
    print("Error:", repr(e))

print("\nPreprocessor:")
print(preprocessor)

print("\nPreprocessor fitted:")
try:
    print(preprocessor.feature_names_in_)
except Exception:
    print("Could not determine feature_names_in_")

print("\n" + "=" * 70)