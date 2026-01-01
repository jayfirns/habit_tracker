import os
import sys
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure the backend package is importable when running tests from this file
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import crud  # noqa: E402
import schemas  # noqa: E402
from database import Base  # noqa: E402

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

START_MS = int(datetime(2024, 4, 1, 9, 0, tzinfo=timezone.utc).timestamp() * 1000)
SECOND_START_MS = int(datetime(2024, 4, 1, 10, 0, tzinfo=timezone.utc).timestamp() * 1000)


@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_start_timer_persists_active_timer(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Write", category="Focus", tags=[])
    )
    payload = schemas.HabitTimerStart(started_at_ms=START_MS)

    # 2. Act
    timer = crud.start_habit_timer(db_session, habit.id, payload)

    # 3. Assert
    assert timer.habit_id == habit.id
    assert timer.started_at_ms == START_MS


def test_start_timer_overwrites_existing_timer(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Read", category="Growth", tags=[])
    )
    crud.start_habit_timer(db_session, habit.id, schemas.HabitTimerStart(started_at_ms=START_MS))

    # 2. Act
    timer = crud.start_habit_timer(
        db_session, habit.id, schemas.HabitTimerStart(started_at_ms=SECOND_START_MS)
    )

    # 3. Assert
    assert timer.started_at_ms == SECOND_START_MS


def test_list_active_timers_returns_running_timers(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Code", category="Work", tags=[])
    )
    crud.start_habit_timer(db_session, habit.id, schemas.HabitTimerStart(started_at_ms=START_MS))

    # 2. Act
    timers = crud.list_active_habit_timers(db_session)

    # 3. Assert
    assert len(timers) == 1
    assert timers[0].habit_id == habit.id


def test_stop_timer_clears_active_timer(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Walk", category="Health", tags=[])
    )
    crud.start_habit_timer(db_session, habit.id, schemas.HabitTimerStart(started_at_ms=START_MS))

    # 2. Act
    stopped = crud.stop_habit_timer(db_session, habit.id)

    # 3. Assert
    assert stopped is True
    assert crud.list_active_habit_timers(db_session) == []
