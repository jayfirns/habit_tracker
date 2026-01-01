import os
import sys
from datetime import date

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
    create_time_log,
    get_time_totals,
    list_all_time_logs,
    list_time_logs,
)

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

LOG_DATE_ONE = date(2024, 3, 1)
LOG_DATE_TWO = date(2024, 3, 2)
LOG_DATE_THREE = date(2024, 3, 3)
MINUTES_SMALL = 10
MINUTES_MEDIUM = 20
MINUTES_LARGE = 30


@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_create_time_log_endpoint_persists_minutes(db_session):
    # 1. Setup
    habit = create_habit(
        schemas.HabitCreate(name="Write", category="Focus", tags=[]), db_session
    )
    payload = schemas.HabitTimeLogCreate(
        log_date=LOG_DATE_ONE, minutes=MINUTES_MEDIUM, source="timer"
    )

    # 2. Act
    response = create_time_log(habit.id, payload, db_session)

    # 3. Assert
    assert response.habit_id == habit.id
    assert response.log_date == LOG_DATE_ONE
    assert response.minutes == MINUTES_MEDIUM
    assert response.source == "timer"


def test_list_time_logs_endpoint_filters_by_date_range(db_session):
    # 1. Setup
    habit = create_habit(
        schemas.HabitCreate(name="Read", category="Growth", tags=[]), db_session
    )
    create_time_log(
        habit.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_ONE, minutes=MINUTES_SMALL, source="manual"
        ),
        db_session,
    )
    create_time_log(
        habit.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_TWO, minutes=MINUTES_MEDIUM, source="manual"
        ),
        db_session,
    )
    create_time_log(
        habit.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_THREE, minutes=MINUTES_LARGE, source="timer"
        ),
        db_session,
    )

    # 2. Act
    logs = list_time_logs(
        habit.id, start_date=LOG_DATE_TWO, end_date=LOG_DATE_THREE, db=db_session
    )

    # 3. Assert
    assert len(logs) == 2
    assert {log.log_date for log in logs} == {LOG_DATE_TWO, LOG_DATE_THREE}


def test_time_totals_endpoint_sums_minutes(db_session):
    # 1. Setup
    habit_one = create_habit(
        schemas.HabitCreate(name="Code", category="Work", tags=[]), db_session
    )
    habit_two = create_habit(
        schemas.HabitCreate(name="Walk", category="Health", tags=[]), db_session
    )
    create_time_log(
        habit_one.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_ONE, minutes=MINUTES_SMALL, source="timer"
        ),
        db_session,
    )
    create_time_log(
        habit_one.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_TWO, minutes=MINUTES_MEDIUM, source="timer"
        ),
        db_session,
    )
    create_time_log(
        habit_two.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_TWO, minutes=MINUTES_LARGE, source="manual"
        ),
        db_session,
    )
    expected_habit_one_total = MINUTES_SMALL + MINUTES_MEDIUM
    expected_habit_two_total = MINUTES_LARGE

    # 2. Act
    totals = get_time_totals(
        start_date=LOG_DATE_ONE, end_date=LOG_DATE_TWO, db=db_session
    )

    # 3. Assert
    assert totals[habit_one.id] == expected_habit_one_total
    assert totals[habit_two.id] == expected_habit_two_total


def test_list_all_time_logs_endpoint_returns_across_habits(db_session):
    # 1. Setup
    habit_one = create_habit(
        schemas.HabitCreate(name="Plan", category="Work", tags=[]), db_session
    )
    habit_two = create_habit(
        schemas.HabitCreate(name="Stretch", category="Health", tags=[]), db_session
    )
    create_time_log(
        habit_one.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_ONE, minutes=MINUTES_SMALL, source="manual"
        ),
        db_session,
    )
    create_time_log(
        habit_two.id,
        schemas.HabitTimeLogCreate(
            log_date=LOG_DATE_TWO, minutes=MINUTES_MEDIUM, source="timer"
        ),
        db_session,
    )

    # 2. Act
    logs = list_all_time_logs(
        start_date=LOG_DATE_ONE, end_date=LOG_DATE_TWO, db=db_session
    )

    # 3. Assert
    assert len(logs) == 2
    assert {log.habit_id for log in logs} == {habit_one.id, habit_two.id}
