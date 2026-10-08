import json
from pathlib import Path
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from backend.app.config import COMBINED_PROCESSED, MODEL_DIR, ROOT
from backend.app.ml.demand_forecasting import forecast
from backend.app.ml.price_recommendation import recommend

app=FastAPI(title="PricePilot AI — Milestone 2",version="2.0.0")

@app.get("/health")
def health(): return {"status":"ok","milestone":2}

@app.get("/api/products/{dataset}")
def products(dataset:str):
    if not COMBINED_PROCESSED.exists():
        raise HTTPException(404,"Run prepare_data first.")
    df=pd.read_csv(COMBINED_PROCESSED)
    p=df[df.dataset==dataset].sort_values("date").groupby("product_id").tail(1)
    return p[["product_id","product_name","category","price"]].to_dict("records")

@app.get("/api/metrics")
def metrics():
    out={}
    for n in ["demand_metrics.json","price_metrics.json"]:
        p=MODEL_DIR/n
        if p.exists(): out[n.replace("_metrics.json","")]=json.loads(p.read_text())
    return out

@app.get("/api/forecast/{dataset}/{product_id}")
def api_forecast(dataset:str,product_id:str,horizon:str="30d"):
    try: return forecast(dataset,product_id,horizon)
    except Exception as e: raise HTTPException(400,str(e))

@app.get("/api/recommend/{dataset}/{product_id}")
def api_recommend(dataset:str,product_id:str):
    try: return recommend(dataset,product_id)
    except Exception as e: raise HTTPException(400,str(e))

@app.get("/")
def dashboard():
    return FileResponse(ROOT/"frontend"/"index.html")
