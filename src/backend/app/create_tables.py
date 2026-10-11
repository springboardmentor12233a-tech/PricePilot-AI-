from app.database import engine, Base
from app.models import user, product, pricing_history, restock_request

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")