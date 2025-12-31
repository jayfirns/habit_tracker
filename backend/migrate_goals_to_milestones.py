from sqlalchemy import inspect, text

from database import engine


def _refresh_inspector(conn):
    return inspect(conn)


def _table_exists(inspector, name):
    return name in inspector.get_table_names()


def _column_names(inspector, table_name):
    return {col["name"] for col in inspector.get_columns(table_name)}


def migrate():
    with engine.begin() as conn:
        dialect = conn.dialect.name
        inspector = _refresh_inspector(conn)

        if _table_exists(inspector, "goals") and not _table_exists(inspector, "milestones"):
            print("Renaming table goals -> milestones")
            conn.execute(text("ALTER TABLE goals RENAME TO milestones"))

        inspector = _refresh_inspector(conn)
        if _table_exists(inspector, "habit_goals") and not _table_exists(
            inspector, "habit_milestones"
        ):
            print("Renaming table habit_goals -> habit_milestones")
            conn.execute(text("ALTER TABLE habit_goals RENAME TO habit_milestones"))

        inspector = _refresh_inspector(conn)
        if _table_exists(inspector, "habit_milestones"):
            columns = _column_names(inspector, "habit_milestones")
            if "goal_id" in columns and "milestone_id" not in columns:
                print("Renaming column habit_milestones.goal_id -> milestone_id")
                conn.execute(
                    text("ALTER TABLE habit_milestones RENAME COLUMN goal_id TO milestone_id")
                )

        inspector = _refresh_inspector(conn)
        if _table_exists(inspector, "reflections"):
            columns = _column_names(inspector, "reflections")
            if "milestone_id" not in columns:
                print("Adding reflections.milestone_id column")
                conn.execute(text("ALTER TABLE reflections ADD COLUMN milestone_id INTEGER"))
                columns.add("milestone_id")
            if "goal_id" in columns and "milestone_id" in columns:
                print("Copying reflections.goal_id -> reflections.milestone_id")
                conn.execute(
                    text(
                        "UPDATE reflections SET milestone_id = goal_id "
                        "WHERE milestone_id IS NULL AND goal_id IS NOT NULL"
                    )
                )

        if dialect not in {"sqlite", "postgresql"}:
            print(f"Note: migration completed with generic SQL on dialect '{dialect}'.")


if __name__ == "__main__":
    migrate()
