from database import SessionLocal
from audit import create_audit_log


db = SessionLocal()

create_audit_log(
    db=db,
    username="admin_test",
    role="ADMIN",
    action="Test audit log",
    target="System",
    old_value="Before",
    new_value="After"
)

db.close()

print("Audit log created successfully.")