import sqlite3

# Connect to the database
conn = sqlite3.connect('habit_tracker.db')

# Create a cursor object
cursor = conn.cursor()

# Execute the query to list all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")

# Fetch all results
tables = cursor.fetchall()

# Print the names of the tables
print("Tables in the database:")
for table in tables:
    print(table[0])

# Close the cursor and connection
cursor.close()
conn.close()
