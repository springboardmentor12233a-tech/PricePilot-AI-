import pandas as pd
import matplotlib.pyplot as plt
from backend.app.config import ROOT, EDA_DIR, ONLINE_PROCESSED

OUT=EDA_DIR/"online_retail"
OUT.mkdir(parents=True,exist_ok=True)

def main():
    if not ONLINE_PROCESSED.exists():
        raise FileNotFoundError("Run prepare_data first.")
    df=pd.read_csv(ONLINE_PROCESSED,parse_dates=["date"], low_memory=False)
    summary={
        "rows":int(len(df)),
        "products":int(df.product_id.nunique()),
        "start_date":str(df.date.min().date()),
        "end_date":str(df.date.max().date()),
        "total_units":float(df.units_sold.sum()),
        "total_revenue":float(df.revenue.sum()),
        "average_unit_price":float(df.price.mean())
    }
    pd.DataFrame([summary]).to_csv(OUT/"summary.csv",index=False)

    daily=df.groupby("date",as_index=False).agg(units=("units_sold","sum"),revenue=("revenue","sum"))
    plt.figure(figsize=(11,5)); plt.plot(daily.date,daily.units)
    plt.title("Online Retail — Daily Units Sold"); plt.xlabel("Date"); plt.ylabel("Units")
    plt.tight_layout(); plt.savefig(OUT/"daily_units.png",dpi=150); plt.close()

    top=df.groupby("product_id").units_sold.sum().nlargest(10).sort_values()
    plt.figure(figsize=(9,5)); top.plot(kind="barh")
    plt.title("Online Retail — Top 10 Products by Units"); plt.xlabel("Units")
    plt.tight_layout(); plt.savefig(OUT/"top_products.png",dpi=150); plt.close()

    monthly=df.assign(month=df.date.dt.to_period("M").astype(str)).groupby("month").revenue.sum()
    plt.figure(figsize=(11,5)); monthly.plot()
    plt.title("Online Retail — Monthly Revenue"); plt.xticks(rotation=45)
    plt.tight_layout(); plt.savefig(OUT/"monthly_revenue.png",dpi=150); plt.close()

    print("Online Retail EDA completed.")
    print(summary)
    print("Saved to",OUT)

if __name__=="__main__":
    main()
