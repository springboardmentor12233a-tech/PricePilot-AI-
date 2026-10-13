"""
Run with: python scripts/create_admin.py

Creates (or updates) the first ADMIN user from ADMIN_EMAIL / ADMIN_PASSWORD
in .env. Never hard-code production credentials here.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.database.db import Base, SessionLocal, engine  # noqa: E402
from app.models.models import RoleEnum, User  # noqa: E402


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if existing:
            existing.hashed_password = hash_password(settings.ADMIN_PASSWORD)
            existing.role = RoleEnum.ADMIN
            existing.is_active = True
            db.commit()
            print(f"Updated existing admin user: {settings.ADMIN_EMAIL}")
        else:
            admin = User(
                email=settings.ADMIN_EMAIL,
                full_name="Administrator",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=RoleEnum.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"Created admin user: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
