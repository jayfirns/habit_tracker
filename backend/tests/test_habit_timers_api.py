import os
import sys
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure the backend package is importable when running tests from this file
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import schemas  # noqa: E402
from database import Base  # noqa: E402
from main import (  # noqa: E402
    create_habit,
    list_active_timers,
    start_habit_timer,
    stop_habit_timer,
)

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

START_MS = int(datetime(2024, 4, 2, 9, 0, tzinfo=timezone.utc).timestamp() * 1000)


@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_start_timer_endpoint_persists_timer(db_session):
    # 1. Setup
    habit = create_habit(
        schemas.HabitCreate(name="Write", category="Focus", tags=[]), db_session
    )
    payload = schemas.HabitTimerStart(started_at_ms=START_MS)

    # 2. Act
    timer = start_habit_timer(habit.id, payload, db_session)

    # 3. Assert
    assert timer.habit_id == habit.id
    assert timer.started_at_ms == START_MS


def test_list_active_timers_endpoint_returns_running_timers(db_session):
    # 1. Setup
    habit = create_habit(
        schemas.HabitCreate(name="Plan", category="Work", tags=[]), db_session
    )
    start_habit_timer(habit.id, schemas.HabitTimerStart(started_at_ms=START_MS), db_session)

    # 2. Act
    timers = list_active_timers(db_session)

    # 3. Assert
    assert len(timers) == 1
    assert timers[0].habit_id == habit.id


def test_stop_timer_endpoint_clears_timer(db_session):
    # 1. Setup
    habit = create_habit(
        schemas.HabitCreate(name="Walk", category="Health", tags=[]), db_session
    )
    start_habit_timer(habit.id, schemas.HabitTimerStart(started_at_ms=START_MS), db_session)

    # 2. Act
    response = stop_habit_timer(habit.id, db_session)

    # 3. Assert
    assert response.status_code == 204
    assert list_active_timers(db_session) == []
