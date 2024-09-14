import sqlite3

# Connect to the database
conn = sqlite3.connect('habit_tracker.db')

# Create a cursor object
cursor = conn.cursor()


# Step 1: Create a new table with the desired schema
cursor.execute('''
    CREATE TABLE IF NOT EXISTS completions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER,
        date TEXT,
        note TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits (id)
    )
''')

# Step 2: Copy data from the old completions table to the new table
cursor.execute('''
    INSERT INTO completions_new (habit_id, date)
    SELECT habit_id, date FROM completions
''')

# Step 3: Drop the old completions table
cursor.execute('DROP TABLE completions')

# Step 4: Rename the new table to completions
cursor.execute('ALTER TABLE completions_new RENAME TO completions')

# Commit the changes to the database
conn.commit()


# Close the cursor and connection
cursor.close()
conn.close()
