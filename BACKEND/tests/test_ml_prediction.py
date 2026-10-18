import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from app.core.config import settings
from app.services.ai_service import predict_personal_model

MODEL_PATH=Path(__file__).resolve().parent.parent/"saved_models"/"pricepilot_xgboost_model_v2.pkl"
TEST_DATA={"Store ID":"S001","Product ID":"P001","Category":"Groceries","Region":"North",
"Inventory Level":150,"Price":599,"Discount":15,"Weather Condition":"Sunny","Promotion":1,
"Competitor Pricing":579,"Seasonality":"Summer","Epidemic":0,"Year":2024,"Month":1,"Day":15,
"Price Difference":20,"Relative Price Difference":20/579,"Price Position":"Above Competitor",
"Day of Week":0,"Quarter":1,"Week of Year":3,"Month Sin":0.5,"Month Cos":0.8660,
"DayOfWeek Sin":0.0,"DayOfWeek Cos":1.0}

def test_saved_model_and_service_return_finite_demand():
    artifact=joblib.load(MODEL_PATH)
    features=artifact["features"]
    assert "Units Ordered" not in features
    assert set(features).issubset(TEST_DATA)
    frame=pd.DataFrame([{name:TEST_DATA[name] for name in features}],columns=features)
    transformed=artifact["preprocessor"].transform(frame)
    assert np.isfinite(float(artifact["model"].predict(transformed)[0]))
    settings.PERSONAL_MODEL_PATH=str(MODEL_PATH)
    result=predict_personal_model(TEST_DATA)
    assert np.isfinite(result["prediction"])
    assert result["model_version"]==str(artifact["version"])
