from backend.database.database import SessionLocal
from backend.database.models import User, Role
from backend.auth.security import hash_password


db = SessionLocal()

try:
    username = "adminuser"
    email = "admin@example.com"
    password = "Admin@123"

    # Check if Admin role exists
    role = db.query(Role).filter(Role.name == "Admin").first()

    if not role:
        print("Admin role not found.")
    else:
        # Check if user already exists
        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("Admin user already exists.")
        else:
            admin = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                role_id=role.id
            )

            db.add(admin)
            db.commit()
            db.refresh(admin)

            print("Admin created successfully!")
            print("Username:", username)
            print("Email:", email)
            print("Password:", password)
            print("Role:", role.name)

finally:
    db.close()