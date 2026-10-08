from pathlib import Path

import pandas as pd


csv_path = Path(__file__).with_name("ecommerce_product_demand.csv")
df = pd.read_csv(csv_path)

print(df.head())
df.info()