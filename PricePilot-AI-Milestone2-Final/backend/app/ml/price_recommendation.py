import numpy as np
import pandas as pd
from backend.app.config import COMBINED_PROCESSED

def recommend(dataset,product_id):
    df=pd.read_csv(COMBINED_PROCESSED,parse_dates=["date"], low_memory=False)
    p=df[(df.dataset==dataset)&(df.product_id.astype(str)==str(product_id))].sort_values("date")
    if p.empty: raise ValueError("Product not found for selected dataset.")
    recent=p.tail(90)
    current=float(recent.price.iloc[-1])
    avg_price=float(recent.price.mean())
    avg_units=float(recent.units_sold.mean())

    if len(recent)>=10 and recent.price.std()>1e-9:
        slope=np.polyfit(recent.price,recent.units_sold,1)[0]
        elasticity=float(np.clip(slope*avg_price/max(avg_units,1e-9),-3.0,-0.05))
    else:
        elasticity=-1.0

    candidates=np.linspace(current*.85,current*1.15,61)
    expected_units=avg_units*(candidates/max(avg_price,1e-9))**elasticity
    revenue=candidates*expected_units
    i=int(np.argmax(revenue))
    return {
        "dataset":dataset,"product_id":str(product_id),
        "current_price":round(current,2),
        "recommended_price":round(float(candidates[i]),2),
        "expected_daily_units":round(float(expected_units[i]),2),
        "expected_daily_revenue":round(float(revenue[i]),2),
        "estimated_elasticity":round(elasticity,3),
        "price_change_pct":round(float((candidates[i]/current-1)*100),2),
        "method":"constrained local price-demand elasticity simulation"
    }
