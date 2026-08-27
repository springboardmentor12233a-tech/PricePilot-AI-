"""
Sets up the SQLAlchemy "engine" (the thing that actually talks to Postgres)
and gives us a `get_db()` function that FastAPI routes will use to borrow
a database session for the duration of a single request.

Key concept for you (new to this pattern):
- `engine`      -> manages the actual connection pool to Postgres
- `SessionLocal` -> a factory that creates new DB "sessions" (think: a
                    temporary workspace where you queue up queries/changes)
- `get_db()`    -> a "dependency" FastAPI calls before running your route,
                    hands your route a session, and closes it afterward
                    (even if your route raises an error). This pattern
                    prevents connection leaks.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All our ORM models (in app/models/) will inherit from this Base.
# SQLAlchemy uses it to know which Python classes map to which DB tables.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency. Usage in a route:

        @router.get("/products")
        def list_products(db: Session = Depends(get_db)):
            ...

    The `yield` pattern here means: give the session to the route,
    let the route do its work, then run the code after `yield`
    (closing the session) no matter what happens.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
