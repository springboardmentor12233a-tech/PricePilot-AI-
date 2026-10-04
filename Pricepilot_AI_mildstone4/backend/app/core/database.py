from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Attempt PostgreSQL connection, fall back gracefully to local SQLite
try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
    print("Connected to PostgreSQL Database")
except Exception as e:
    sqlite_url = "sqlite:///./pricepilot_m3.db"
    print(f"PostgreSQL not accessible locally ({e}). Using SQLite fallback: {sqlite_url}")
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
