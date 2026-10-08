import pandas as pd
from pathlib import Path
from backend.app.config import ROOT, PROCESSED_DIR, ONLINE_PROCESSED, AMAZON_PROCESSED, COMBINED_PROCESSED

def prepare_online(path):
    df = pd.read_excel(path, sheet_name=0)
    df = df.rename(columns={
        "InvoiceNo":"invoice","StockCode":"product_id","Description":"product_name",
        "Quantity":"quantity","InvoiceDate":"date","UnitPrice":"price",
        "CustomerID":"customer_id","Country":"country"
    })
    df["invoice"] = df["invoice"].astype(str)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df[~df["invoice"].str.startswith("C")]
    df = df.dropna(subset=["product_id","date","quantity","price"])
    df = df[(df.quantity > 0) & (df.price > 0)]
    df["date"] = df.date.dt.floor("D")
    df["revenue"] = df.quantity * df.price
    daily = df.groupby(["product_id","date"],as_index=False).agg(
        product_name=("product_name","first"),
        units_sold=("quantity","sum"), revenue=("revenue","sum"),
        price=("price","mean"), discount=("price",lambda s: 0.0)
    )
    daily["category"]="Retail"
    daily["dataset"]="Online Retail"
    daily["is_promo"]=0
    daily.to_csv(ONLINE_PROCESSED,index=False)
    return daily

def prepare_amazon(path):
    df = pd.read_csv(path)
    df["OrderDate"] = pd.to_datetime(df["OrderDate"], errors="coerce")
    for c in ["Quantity","UnitPrice","Discount","Tax","ShippingCost","TotalAmount"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["ProductID","OrderDate","Quantity","UnitPrice"])
    # For demand forecasting, delivered orders are the cleanest sales signal.
    delivered = df[df["OrderStatus"].astype(str).str.lower().eq("delivered")]
    if len(delivered) >= 100:
        df = delivered
    df = df[(df.Quantity > 0) & (df.UnitPrice > 0)]
    df["date"] = df.OrderDate.dt.floor("D")
    df["revenue"] = df["Quantity"] * df["UnitPrice"] * (1-df["Discount"].fillna(0))
    daily = df.groupby(["ProductID","date"],as_index=False).agg(
        product_name=("ProductName","first"), category=("Category","first"),
        units_sold=("Quantity","sum"), revenue=("revenue","sum"),
        price=("UnitPrice","mean"), discount=("Discount","mean")
    ).rename(columns={"ProductID":"product_id"})
    daily["dataset"]="Amazon"
    daily["is_promo"]=(daily.discount > 0).astype(int)
    daily.to_csv(AMAZON_PROCESSED,index=False)
    return daily

def main():
    online = prepare_online(ROOT/"data/raw/Online Retail.xlsx")
    amazon = prepare_amazon(ROOT/"data/raw/Amazon.csv")
    common=["product_id","product_name","category","date","units_sold","revenue","price","discount","dataset","is_promo"]
    combined=pd.concat([online[common],amazon[common]],ignore_index=True)
    combined=combined.sort_values(["dataset","product_id","date"])
    combined.to_csv(COMBINED_PROCESSED,index=False)
    print(f"Online Retail daily rows: {len(online):,}")
    print(f"Amazon daily rows: {len(amazon):,}")
    print(f"Combined daily rows: {len(combined):,}")
    print(f"Combined products: {combined.product_id.nunique():,}")
    print(f"Saved: {COMBINED_PROCESSED}")

if __name__=="__main__":
    main()
