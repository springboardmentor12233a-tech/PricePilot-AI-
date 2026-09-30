from backend.database.database import engine, Base
from backend.database.models import (
    Role,
    User,
    Category,
    Product,
    Sale,
    CompetitorPrice
)

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")