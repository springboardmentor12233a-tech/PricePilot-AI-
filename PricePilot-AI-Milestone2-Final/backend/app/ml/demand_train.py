import json
import numpy as np
import pandas as pd
from joblib import dump
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from backend.app.config import COMBINED_PROCESSED, MODEL_DIR

FEATURES=["price","discount","day_of_week","month","day_of_month","lag_1","lag_7","rolling_7","rolling_30"]

def make_features(df):
    df=df.copy().sort_values(["dataset","product_id","date"])
    df["day_of_week"]=df.date.dt.dayofweek
    df["month"]=df.date.dt.month
    df["day_of_month"]=df.date.dt.day
    g=df.groupby(["dataset","product_id"],group_keys=False)
    df["lag_1"]=g.units_sold.shift(1)
    df["lag_7"]=g.units_sold.shift(7)
    df["rolling_7"]=g.units_sold.transform(lambda s:s.shift(1).rolling(7).mean())
    df["rolling_30"]=g.units_sold.transform(lambda s:s.shift(1).rolling(30).mean())
    return df.dropna(subset=FEATURES+["units_sold"])

def train():
    df=pd.read_csv(COMBINED_PROCESSED,parse_dates=["date"], low_memory=False)
    frame=make_features(df).sort_values("date")
    split=int(len(frame)*.8)
    tr,te=frame.iloc[:split],frame.iloc[split:]
    model=HistGradientBoostingRegressor(
        max_iter=300, learning_rate=.05, max_leaf_nodes=31,
        l2_regularization=1.0, random_state=42
    )
    model.fit(tr[FEATURES],tr.units_sold)
    pred=np.maximum(model.predict(te[FEATURES]),0)
    metrics={
        "mae":float(mean_absolute_error(te.units_sold,pred)),
        "rmse":float(np.sqrt(mean_squared_error(te.units_sold,pred))),
        "train_rows":len(tr),"test_rows":len(te)
    }
    dump({"model":model,"features":FEATURES},MODEL_DIR/"demand_model.joblib")
    (MODEL_DIR/"demand_metrics.json").write_text(json.dumps(metrics,indent=2))
    print(json.dumps(metrics,indent=2))
    return metrics

if __name__=="__main__":
    train()
