#!/usr/bin/env python3
"""
Migration script: Milestone -> SmartGoal

This script:
1. Creates smart_goals table
2. Creates habit_goals junction table
3. Adds goal_id column to completions
4. Adds goal_id column to reflections (replacing milestone_id)
5. Migrates existing milestones to smart_goals with default values
6. Migrates habit_milestones to habit_goals
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
        # 1. Create smart_goals table if not exists
        print("Creating smart_goals table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS smart_goals (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                why_this_matters TEXT,
                frequency INTEGER NOT NULL DEFAULT 1,
                frequency_period TEXT NOT NULL DEFAULT 'week',
                success_threshold INTEGER DEFAULT 80,
                quarter TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                status TEXT DEFAULT 'active',
                created_at TEXT
            )
        """)

        # 2. Create habit_goals junction table if not exists
        print("Creating habit_goals table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS habit_goals (
                habit_id INTEGER NOT NULL,
                goal_id INTEGER NOT NULL,
                PRIMARY KEY (habit_id, goal_id),
                FOREIGN KEY (habit_id) REFERENCES habits(id),
                FOREIGN KEY (goal_id) REFERENCES smart_goals(id)
            )
        """)

        # 3. Add goal_id column to completions if not exists
        print("Adding goal_id to completions...")
        try:
            cursor.execute("ALTER TABLE completions ADD COLUMN goal_id INTEGER REFERENCES smart_goals(id)")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  goal_id column already exists in completions")
            else:
                raise

        # 4. Check if reflections has milestone_id and add goal_id
        print("Handling reflections table...")
        cursor.execute("PRAGMA table_info(reflections)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'goal_id' not in columns:
            if 'milestone_id' in columns:
                # Rename milestone_id to goal_id
                print("  Renaming milestone_id to goal_id in reflections...")
                # SQLite doesn't support RENAME COLUMN in older versions, so we recreate
                cursor.execute("ALTER TABLE reflections ADD COLUMN goal_id INTEGER REFERENCES smart_goals(id)")
                cursor.execute("UPDATE reflections SET goal_id = milestone_id WHERE milestone_id IS NOT NULL")
            else:
                cursor.execute("ALTER TABLE reflections ADD COLUMN goal_id INTEGER REFERENCES smart_goals(id)")
        else:
            print("  goal_id already exists in reflections")

        # 5. Migrate existing milestones to smart_goals
        print("Checking for existing milestones to migrate...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='milestones'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) FROM milestones")
            count = cursor.fetchone()[0]
            if count > 0:
                print(f"  Migrating {count} milestones to smart_goals...")
                cursor.execute("""
                    INSERT OR IGNORE INTO smart_goals (id, title, why_this_matters, frequency, frequency_period,
                                                       success_threshold, quarter, tags, status, created_at)
                    SELECT id, title, description, 1, 'week', 80,
                           CASE
                               WHEN scope = 'quarter' THEN 'Q1 2026'
                               ELSE 'Q1 2026'
                           END,
                           tags, status, start_date
                    FROM milestones
                    WHERE id NOT IN (SELECT id FROM smart_goals)
                """)

        # 6. Migrate habit_milestones to habit_goals
        print("Checking for habit_milestones to migrate...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='habit_milestones'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) FROM habit_milestones")
            count = cursor.fetchone()[0]
            if count > 0:
                print(f"  Migrating {count} habit-milestone links to habit_goals...")
                cursor.execute("""
                    INSERT OR IGNORE INTO habit_goals (habit_id, goal_id)
                    SELECT habit_id, milestone_id FROM habit_milestones
                """)

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
