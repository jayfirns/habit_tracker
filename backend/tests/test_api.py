import os
import sys
from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure the backend package is importable when running tests from this file
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import models  # noqa: E402
import schemas  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from database import Base  # noqa: E402
import crud  # noqa: E402
from main import (  # noqa: E402
    complete_habit,
    create_habit,
    create_goal,
    delete_habit,
    get_habit,
    get_workday_state,
    list_completions,
    list_habits,
    update_habit,
    update_workday_state,
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


def test_delete_completed_habit_clears_completions(db_session):
    habit = create_habit(schemas.HabitCreate(name="Practice", category="Skills"), db_session)
    complete_habit(
        habit.id,
        schemas.CompletionCreate(note="Session", date=date.today()),
        db_session,
    )

    response = delete_habit(habit.id, db_session)
    assert response.status_code == 204

    assert list_habits(db_session) == []
    with pytest.raises(HTTPException) as excinfo:
        get_habit(habit.id, db_session)
    assert excinfo.value.status_code == 404


def test_delete_habit_removes_completions_from_db(db_session):
    habit = create_habit(schemas.HabitCreate(name="Stretch", category="Health"), db_session)
    complete_habit(
        habit.id,
        schemas.CompletionCreate(note="Evening stretch", date=date.today()),
        db_session,
    )

    completions_before = (
        db_session.query(models.Completion).filter_by(habit_id=habit.id).count()
    )
    assert completions_before == 1

    response = delete_habit(habit.id, db_session)
    assert response.status_code == 204

    completions_after = (
        db_session.query(models.Completion).filter_by(habit_id=habit.id).count()
    )
    assert completions_after == 0


def test_delete_habit_clears_goal_links(db_session):
    habit = create_habit(schemas.HabitCreate(name="Write", category="Work"), db_session)
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Ship Draft",
            frequency=3,
            quarter="Q1 2026",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    links_before = db_session.execute(
        select(models.habit_goal_table).where(
            models.habit_goal_table.c.habit_id == habit.id
        )
    ).all()
    assert len(links_before) == 1

    response = delete_habit(habit.id, db_session)
    assert response.status_code == 204

    links_after = db_session.execute(
        select(models.habit_goal_table).where(
            models.habit_goal_table.c.habit_id == habit.id
        )
    ).all()
    assert links_after == []


def test_delete_habit_does_not_delete_goal(db_session):
    habit = create_habit(schemas.HabitCreate(name="Plan", category="Work"), db_session)
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Ship Plan",
            frequency=3,
            quarter="Q1 2026",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    response = delete_habit(habit.id, db_session)
    assert response.status_code == 204

    goals = crud.list_goals(db_session)
    assert len(goals) == 1
    assert goals[0].id == goal.id
    assert goals[0].status == "active"


def test_delete_nonexistent_habit_returns_404(db_session):
    with pytest.raises(HTTPException) as excinfo:
        delete_habit(999, db_session)
    assert excinfo.value.status_code == 404


def test_delete_habit_blocks_completion_listing(db_session):
    habit = create_habit(schemas.HabitCreate(name="Cook", category="Home"), db_session)
    complete_habit(
        habit.id,
        schemas.CompletionCreate(note="Dinner", date=date.today()),
        db_session,
    )

    response = delete_habit(habit.id, db_session)
    assert response.status_code == 204

    with pytest.raises(HTTPException) as excinfo:
        list_completions(habit.id, db_session)
    assert excinfo.value.status_code == 404


def test_delete_habit_does_not_affect_other_habits(db_session):
    habit_a = create_habit(schemas.HabitCreate(name="Yoga", category="Health"), db_session)
    habit_b = create_habit(schemas.HabitCreate(name="Study", category="Work"), db_session)
    complete_habit(
        habit_a.id,
        schemas.CompletionCreate(note="Morning", date=date.today()),
        db_session,
    )
    complete_habit(
        habit_b.id,
        schemas.CompletionCreate(note="Evening", date=date.today()),
        db_session,
    )

    response = delete_habit(habit_a.id, db_session)
    assert response.status_code == 204

    remaining = list_habits(db_session)
    assert len(remaining) == 1
    assert remaining[0].id == habit_b.id
    assert len(remaining[0].completions) == 1


def test_get_workday_state_creates_default(db_session):
    state = get_workday_state(db_session)
    assert state.id is not None
    assert state.workday_date == date.today().isoformat()
    assert state.planned_start == "09:00"
    assert state.planned_minutes is None
    assert state.clock_in_at is None


def test_update_workday_state_persists(db_session):
    updated = update_workday_state(
        schemas.WorkdayStateUpdate(
            workday_date=date(2025, 1, 15),
            planned_start="08:30",
            planned_minutes=180,
            clock_in_at="2025-01-15T08:30:00Z",
            clock_out_at=None,
            worked_minutes_override=None,
        ),
        db_session,
    )
    assert updated.workday_date == "2025-01-15"
    assert updated.planned_start == "08:30"
    assert updated.planned_minutes == 180
    assert updated.clock_in_at == "2025-01-15T08:30:00Z"

    fetched = get_workday_state(db_session)
    assert fetched.id == updated.id
    assert fetched.workday_date == "2025-01-15"
    assert fetched.planned_minutes == 180


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
