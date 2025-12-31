import sqlite3
from pathlib import Path

from database import DATABASE_URL


def sqlite_path_from_url(url: str) -> Path | None:
    prefix = "sqlite:///"
    if not url.startswith(prefix):
        return None
    return Path(url[len(prefix) :])


def column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def main() -> None:
    db_path = sqlite_path_from_url(DATABASE_URL)
    if db_path is None:
        raise SystemExit("DATABASE_URL is not sqlite; apply migration manually.")

    if not db_path.exists():
        raise SystemExit(f"SQLite DB not found at {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    if not column_exists(cursor, "workday_states", "workday_date"):
        cursor.execute("ALTER TABLE workday_states ADD COLUMN workday_date TEXT")
        conn.commit()
        print("Added workday_date column to workday_states.")
    else:
        print("workday_date column already present.")
    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
