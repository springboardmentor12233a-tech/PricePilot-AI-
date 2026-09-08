from sqlalchemy import text

from app.database.database import engine


try:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT version();")
        )

        print(result.fetchone())

    print("PostgreSQL connection successful!")

except Exception as error:
    print("Database connection failed!")
    print(error)