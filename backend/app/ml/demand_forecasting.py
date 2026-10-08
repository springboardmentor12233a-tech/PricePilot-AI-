import json
from datetime import timedelta
import numpy as np
import pandas as pd
from joblib import load
from backend.app.config import COMBINED_PROCESSED, MODEL_DIR

HORIZONS={"7d":7,"14d":14,"30d":30,"3m":90,"6m":180,"12m":365}
FEATURES=["price","discount","day_of_week","month","day_of_month","lag_1","lag_7","rolling_7","rolling_30"]

def _trend(values):
    n=max(1,len(values)//3)
    a=np.mean(values[:n]); b=np.mean(values[-n:])
    pct=(b-a)/max(abs(a),1e-9)
    return "Increasing" if pct>.05 else "Decreasing" if pct<-.05 else "Stable"

def forecast(dataset,product_id,horizon):
    if horizon not in HORIZONS: raise ValueError(f"Invalid horizon: {horizon}")
    df=pd.read_csv(COMBINED_PROCESSED,parse_dates=["date"], low_memory=False)
    p=df[(df.dataset==dataset)&(df.product_id.astype(str)==str(product_id))].sort_values("date")
    if p.empty: raise ValueError("Product not found for selected dataset.")
    bundle=load(MODEL_DIR/"demand_model.joblib")
    model=bundle["model"]
    hist=p[["date","units_sold","price","discount"]].copy()
    preds=[]
    for step in range(1,HORIZONS[horizon]+1):
        d=hist.date.max()+timedelta(days=1)
        lag1=float(hist.units_sold.iloc[-1])
        lag7=float(hist.units_sold.iloc[-7]) if len(hist)>=7 else float(hist.units_sold.mean())
        r7=float(hist.units_sold.tail(7).mean())
        r30=float(hist.units_sold.tail(30).mean())
        x=pd.DataFrame([{
            "price":float(hist.price.iloc[-1]),"discount":float(hist.discount.iloc[-1]),
            "day_of_week":d.dayofweek,"month":d.month,"day_of_month":d.day,
            "lag_1":lag1,"lag_7":lag7,"rolling_7":r7,"rolling_30":r30
        }])[FEATURES]
        y=max(0,float(model.predict(x)[0]))
        preds.append(y)
        hist.loc[len(hist)] = [d,y,float(hist.price.iloc[-1]),float(hist.discount.iloc[-1])]
    metrics=json.loads((MODEL_DIR/"demand_metrics.json").read_text())
    baseline=max(float(p.units_sold.mean()),1)
    confidence=float(np.clip(100*np.exp(-metrics["rmse"]/baseline),0,100))
    return {
        "dataset":dataset,"product_id":str(product_id),"horizon":horizon,
        "predicted_units":round(sum(preds),2),
        "average_daily_units":round(float(np.mean(preds)),2),
        "trend":_trend(preds),"confidence_score":round(confidence,2),
        "model_used":"HistGradientBoostingRegressor",
        "mae":round(metrics["mae"],4),"rmse":round(metrics["rmse"],4)
    }
