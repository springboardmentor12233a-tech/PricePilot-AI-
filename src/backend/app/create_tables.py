from app.database import engine, Base
from app.models import user, product, pricing_history

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")