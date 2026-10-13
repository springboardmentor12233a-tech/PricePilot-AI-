"""Load the saved price model + metadata for display on the Model Performance page."""
from app.ml.price_prediction.predict_price import get_model_metadata


def evaluate() -> dict:
    meta = get_model_metadata()
    if meta is None:
        return {"trained": False, "message": "No price model found. Run training first."}
    return {"trained": True, **meta}


if __name__ == "__main__":
    import json
    print(json.dumps(evaluate(), indent=2))
