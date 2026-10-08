import joblib
import pandas as pd

MODEL_PATH = "pricepilot_xgb_model.pkl"
PREPROCESSOR_PATH = "pricepilot_preprocessor.pkl"

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)


def predict_demand(data: dict):
    df = pd.DataFrame([data])

    transformed_data = preprocessor.transform(df)

    prediction = model.predict(transformed_data)[0]

    return float(prediction)