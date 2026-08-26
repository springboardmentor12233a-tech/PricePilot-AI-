from db_connection import get_connection

connection = get_connection()
cursor = connection.cursor()

cursor.execute("SHOW TABLES")

tables = cursor.fetchall()

print("Tables in pricepilot_db:")

for table in tables:
    print(table[0])

cursor.close()
connection.close()

from db_connection import get_connection

connection = get_connection()
cursor = connection.cursor()

cursor.execute("DESCRIBE products")

columns = cursor.fetchall()

print("Products table structure:")

for column in columns:
    print(column)

cursor.close()
connection.close()