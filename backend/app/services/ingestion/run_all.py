"""
Runs all 3 dataset ingestion pipelines in order.

Usage (from the backend/ folder, with venv activated):
    python -m app.services.ingestion.run_all

Optional: for a fast first test, sample only a fraction of the large
datasets (Favorita, Online Retail II) so ingestion finishes in seconds:
    python -m app.services.ingestion.run_all --sample 0.05
This loads ~5% of rows -- enough to verify everything works end-to-end
before committing to the full ~15-20 minute load of all 1.4M+ rows.
"""

import argparse
import time
from pathlib import Path

from app.core.database import SessionLocal
from app.services.ingestion.ingest_retail_price import ingest_retail_price
from app.services.ingestion.ingest_favorita import ingest_favorita
from app.services.ingestion.ingest_online_retail import ingest_online_retail

# Paths are relative to the project root's data/raw/ folder.
# __file__ is .../backend/app/services/ingestion/run_all.py, so we go
# up 5 levels to reach the project root, then into data/raw/.
PROJECT_ROOT = Path(__file__).resolve().parents[4]
DATA_RAW = PROJECT_ROOT / "data" / "raw"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sample", type=float, default=None,
        help="Fraction (0-1) of large datasets to load, e.g. 0.05 for a quick test run"
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        print("=" * 60)
        print("1/3  Retail Price Optimization (retail_price.csv)")
        print("=" * 60)
        t0 = time.time()
        result = ingest_retail_price(db, str(DATA_RAW / "retail_price.csv"))
        print(result, f"  ({time.time() - t0:.1f}s)")

        print()
        print("=" * 60)
        print("2/3  Favorita Sales (favorita_sales.csv)")
        print("=" * 60)
        t0 = time.time()
        result = ingest_favorita(db, str(DATA_RAW / "favorita_sales.csv"), sample_frac=args.sample)
        print(result, f"  ({time.time() - t0:.1f}s)")

        print()
        print("=" * 60)
        print("3/3  Online Retail II (online_retail_II.xlsx)")
        print("=" * 60)
        t0 = time.time()
        result = ingest_online_retail(db, str(DATA_RAW / "online_retail_II.xlsx"), sample_frac=args.sample)
        print(result, f"  ({time.time() - t0:.1f}s)")

        print()
        print("All 3 datasets ingested successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
