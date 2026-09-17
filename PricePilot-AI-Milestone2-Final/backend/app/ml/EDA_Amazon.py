import pandas as pd
import matplotlib.pyplot as plt
from backend.app.config import ROOT, EDA_DIR, AMAZON_PROCESSED

OUT=EDA_DIR/"amazon"
OUT.mkdir(parents=True,exist_ok=True)

def main():
    if not AMAZON_PROCESSED.exists():
        raise FileNotFoundError("Run prepare_data first.")
    df=pd.read_csv(AMAZON_PROCESSED,parse_dates=["date"], low_memory=False)
    summary={
        "rows":int(len(df)),
        "products":int(df.product_id.nunique()),
        "categories":int(df.category.nunique()),
        "start_date":str(df.date.min().date()),
        "end_date":str(df.date.max().date()),
        "total_units":float(df.units_sold.sum()),
        "total_revenue":float(df.revenue.sum()),
        "average_discount":float(df.discount.mean())
    }
    pd.DataFrame([summary]).to_csv(OUT/"summary.csv",index=False)

    cat=df.groupby("category").units_sold.sum().sort_values()
    plt.figure(figsize=(9,5)); cat.plot(kind="barh")
    plt.title("Amazon — Units Sold by Category"); plt.xlabel("Units")
    plt.tight_layout(); plt.savefig(OUT/"category_units.png",dpi=150); plt.close()

    monthly=df.assign(month=df.date.dt.to_period("M").astype(str)).groupby("month").revenue.sum()
    plt.figure(figsize=(11,5)); monthly.plot()
    plt.title("Amazon — Monthly Revenue"); plt.xticks(rotation=45)
    plt.tight_layout(); plt.savefig(OUT/"monthly_revenue.png",dpi=150); plt.close()

    discounts=df.groupby("category").discount.mean().sort_values()
    plt.figure(figsize=(9,5)); discounts.plot(kind="barh")
    plt.title("Amazon — Average Discount by Category"); plt.xlabel("Discount")
    plt.tight_layout(); plt.savefig(OUT/"category_discount.png",dpi=150); plt.close()

    print("Amazon EDA completed.")
    print(summary)
    print("Saved to",OUT)

if __name__=="__main__":
    main()
