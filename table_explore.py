import sqlite3

# Connect to the database
conn = sqlite3.connect('habit_tracker.db')

# Create a cursor object
cursor = conn.cursor()

cursor.execute("SELECT * FROM completions;")
rows = cursor.fetchall()
for row in rows:
    print(row)


# Close the cursor and connection
cursor.close()
conn.close()
