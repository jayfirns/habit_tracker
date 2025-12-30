import sys
import os
from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure the backend package is importable when running tests from this file
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import schemas  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from database import Base  # noqa: E402
from main import (  # noqa: E402
    complete_habit,
    create_habit,
    delete_habit,
    get_habit,
    list_completions,
    list_habits,
    update_habit,
)

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_create_and_list_habits(db_session):
    created = create_habit(schemas.HabitCreate(name="Exercise", category="Health", tags=["focus", "health"]), db_session)
    assert created.name == "Exercise"
    assert created.category == "Health"
    assert created.streak == 0
    assert created.last_completed is None
    assert created.tags == ["focus", "health"]

    habits = list_habits(db_session)
    assert len(habits) == 1
    assert habits[0].name == "Exercise"
    assert habits[0].completions == []
    assert habits[0].tags == ["focus", "health"]


def test_get_habit_by_id(db_session):
    habit = create_habit(schemas.HabitCreate(name="Meditate", category="Wellness"), db_session)

    retrieved = get_habit(habit.id, db_session)
    assert retrieved.name == "Meditate"
    assert retrieved.id == habit.id
    assert retrieved.completions == []


def test_update_habit(db_session):
    habit = create_habit(schemas.HabitCreate(name="Read Book", category="Growth"), db_session)

    updated = update_habit(
        habit.id,
        schemas.HabitUpdate(name="Read Fiction", category="Leisure", tags=["reading"]),
        db_session,
    )
    assert updated.name == "Read Fiction"
    assert updated.category == "Leisure"
    assert updated.tags == ["reading"]


def test_delete_habit_removes_it_from_listing(db_session):
    habit = create_habit(schemas.HabitCreate(name="Walk", category="Health"), db_session)

    response = delete_habit(habit.id, db_session)
    assert response.status_code == 204

    assert list_habits(db_session) == []


def test_complete_habit_updates_streak_and_last_completed(db_session):
    habit = create_habit(schemas.HabitCreate(name="Code", category="Work"), db_session)

    today = date.today()
    yesterday = today - timedelta(days=1)

    complete_habit(
        habit.id,
        schemas.CompletionCreate(note="Started new feature", date=yesterday),
        db_session,
    )
    complete_habit(
        habit.id,
        schemas.CompletionCreate(note="Continued work", date=today),
        db_session,
    )

    refreshed = get_habit(habit.id, db_session)
    assert refreshed.streak == 2
    assert refreshed.last_completed == today.isoformat()
    assert len(refreshed.completions) == 2


def test_get_completions_for_habit(db_session):
    habit = create_habit(schemas.HabitCreate(name="Journal", category="Reflection"), db_session)

    complete_habit(habit.id, schemas.CompletionCreate(note="Morning entry"), db_session)

    completions = list_completions(habit.id, db_session)
    assert len(completions) == 1
    assert completions[0].note == "Morning entry"


def test_validation_errors_for_blank_fields(db_session):
    with pytest.raises(ValueError):
        schemas.HabitCreate(name="", category="")

    habit = create_habit(schemas.HabitCreate(name="Walk", category="Fitness"), db_session)
    with pytest.raises(ValueError):
        schemas.HabitUpdate(name="", category=" ")


def test_complete_nonexistent_habit_returns_none(db_session):
    with pytest.raises(HTTPException) as excinfo:
        complete_habit(999, schemas.CompletionCreate(note="Should fail"), db_session)
    assert excinfo.value.status_code == 404
