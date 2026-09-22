import joblib
from pathlib import Path

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# ============================================================
# MODEL PATH
# ============================================================

MODEL_PATH = (
    Path(r"C:\Infosys_project\PRICEPILOT_AI\BACKEND")
    / "saved_models"
    / "pricepilot_xgboost_model.pkl"
)

print("=" * 60)
print("PRICEPILOT AI - ML MODEL TEST")
print("=" * 60)

print("\nModel path:")
print(MODEL_PATH)

print("\nModel exists:", MODEL_PATH.exists())

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"\nModel file not found:\n{MODEL_PATH}"
    )


# ============================================================
# LOAD MODEL ARTIFACT
# ============================================================

artifact = joblib.load(MODEL_PATH)

print("\nLoaded object type:")
print(type(artifact))


# ============================================================
# READ ARTIFACT
# ============================================================

if not isinstance(artifact, dict):
    raise TypeError(
        "Expected the ML artifact to be a dictionary."
    )

print("\nArtifact keys:")
print(list(artifact.keys()))


model = artifact["model"]
preprocessor = artifact["preprocessor"]
features = artifact["features"]


# ============================================================
# MODEL INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("MODEL INFORMATION")
print("=" * 60)

print("Model:", artifact.get("model_name"))
print("Version:", artifact.get("version"))

print("Model type:", type(model))
print("Preprocessor type:", type(preprocessor))

print("Number of features:", len(features))


# ============================================================
# FEATURES
# ============================================================

print("\n" + "=" * 60)
print("EXPECTED FEATURES")
print("=" * 60)

for i, feature in enumerate(features, 1):
    print(f"{i:2}. {feature}")


# ============================================================
# PREPROCESSOR INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("PREPROCESSOR INFORMATION")
print("=" * 60)

print("Preprocessor loaded successfully.")

try:
    print("Number of transformers:",
          len(preprocessor.transformers_))
except Exception:
    print("Could not inspect transformers.")


# ============================================================
# SUCCESS
# ============================================================

print("\n" + "=" * 60)
print("MODEL LOADED SUCCESSFULLY")
print("=" * 60)