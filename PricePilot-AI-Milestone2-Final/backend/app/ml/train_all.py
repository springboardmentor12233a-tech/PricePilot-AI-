from backend.app.config import COMBINED_PROCESSED
from backend.app.ml.prepare_data import main as prepare
from backend.app.ml.demand_train import train as train_demand
from backend.app.ml.price_train import train as train_price

def main():
    if not COMBINED_PROCESSED.exists():
        prepare()
    print("=== Demand Forecasting Model ===")
    train_demand()
    print("=== Price Prediction Model ===")
    train_price()
    print("Milestone 2 training completed successfully.")

if __name__=="__main__":
    main()
