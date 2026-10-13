import json
import os

from app.core.config import settings

MODELS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.MODELS_DIR))


def evaluate() -> dict:
    path = os.path.join(MODELS_DIR, "demand_model_metadata.json")
    if not os.path.exists(path):
        return {"trained": False, "message": "No demand model evaluation found. Run training first."}
    with open(path) as f:
        return {"trained": True, **json.load(f)}
