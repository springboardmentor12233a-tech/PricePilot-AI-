import json
import numpy as np
import pandas as pd
from joblib import dump
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from backend.app.config import COMBINED_PROCESSED, MODEL_DIR

FEATURES=["units_sold","discount","day_of_week","month","rolling_demand_7"]

def train():
    df=pd.read_csv(COMBINED_PROCESSED,parse_dates=["date"],low_memory=False).sort_values(["dataset","product_id","date"])
    g=df.groupby(["dataset","product_id"],group_keys=False)
    df["day_of_week"]=df.date.dt.dayofweek
    df["month"]=df.date.dt.month
    df["rolling_demand_7"]=g.units_sold.transform(lambda s:s.shift(1).rolling(7).mean())
    df=df.dropna(subset=FEATURES+["price"]).sort_values("date")
    split=int(len(df)*.8)
    tr,te=df.iloc[:split],df.iloc[split:]
    model=HistGradientBoostingRegressor(max_iter=250,learning_rate=.05,max_leaf_nodes=31,l2_regularization=1.0,random_state=42)
    model.fit(tr[FEATURES],tr.price)
    pred=model.predict(te[FEATURES])
    metrics={"mae":float(mean_absolute_error(te.price,pred)),"rmse":float(np.sqrt(mean_squared_error(te.price,pred))),"train_rows":len(tr),"test_rows":len(te)}
    dump({"model":model,"features":FEATURES},MODEL_DIR/"price_model.joblib")
    (MODEL_DIR/"price_metrics.json").write_text(json.dumps(metrics,indent=2))
    print(json.dumps(metrics,indent=2))
    return metrics

if __name__=="__main__": train()
