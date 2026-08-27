from app.core.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS alembic_version;"))
print("Alembic memory successfully cleared!")