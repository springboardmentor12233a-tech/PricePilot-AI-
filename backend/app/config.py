from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
EDA_DIR = DATA_DIR / "eda_outputs"
MODEL_DIR = ROOT / "models"

ONLINE_PROCESSED = PROCESSED_DIR / "online_retail_daily.csv"
AMAZON_PROCESSED = PROCESSED_DIR / "amazon_daily.csv"
COMBINED_PROCESSED = PROCESSED_DIR / "combined_daily.csv"

for p in [RAW_DIR, PROCESSED_DIR, EDA_DIR, MODEL_DIR]:
    p.mkdir(parents=True, exist_ok=True)
