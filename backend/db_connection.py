import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

    return connection


if __name__ == "__main__":
    connection = get_connection()

    if connection.is_connected():
        print("MySQL connection successful!")

    connection.close()
    print("MySQL connection closed.")