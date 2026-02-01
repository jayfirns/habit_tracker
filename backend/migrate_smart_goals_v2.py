#!/usr/bin/env python3
"""
Migration script: Add measure_type, duration_minutes, and due_date to smart_goals

This script:
1. Adds measure_type column (default: 'frequency')
2. Adds duration_minutes column (nullable)
3. Adds due_date column (nullable)
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "habit_tracker.db"


def migrate():
    print(f"Migrating database: {DB_PATH}")

    if not DB_PATH.exists():
        print("Database file not found!")
        return False

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(smart_goals)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Existing columns: {columns}")

        # 1. Add measure_type column if not exists
        if 'measure_type' not in columns:
            print("Adding measure_type column...")
            cursor.execute("""
                ALTER TABLE smart_goals ADD COLUMN measure_type TEXT DEFAULT 'frequency'
            """)
        else:
            print("measure_type column already exists")

        # 2. Add duration_minutes column if not exists
        if 'duration_minutes' not in columns:
            print("Adding duration_minutes column...")
            cursor.execute("""
                ALTER TABLE smart_goals ADD COLUMN duration_minutes INTEGER
            """)
        else:
            print("duration_minutes column already exists")

        # 3. Add due_date column if not exists
        if 'due_date' not in columns:
            print("Adding due_date column...")
            cursor.execute("""
                ALTER TABLE smart_goals ADD COLUMN due_date TEXT
            """)
        else:
            print("due_date column already exists")

        conn.commit()
        print("Migration complete!")
        return True

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
