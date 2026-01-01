import os
import sys
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure the backend package is importable when running tests from this file
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import crud  # noqa: E402
import models  # noqa: E402
import schemas  # noqa: E402
from database import Base  # noqa: E402

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

LOG_DATE_ONE = date(2024, 2, 1)
LOG_DATE_TWO = date(2024, 2, 2)
LOG_DATE_THREE = date(2024, 2, 3)
MINUTES_SMALL = 5
MINUTES_MEDIUM = 15
MINUTES_LARGE = 25


@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_create_time_log_persists_minutes(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Write", category="Focus", tags=[])
    )
    payload = schemas.HabitTimeLogCreate(
        log_date=LOG_DATE_ONE, minutes=MINUTES_LARGE, source="timer"
    )

    # 2. Act
    time_log = crud.create_habit_time_log(db_session, habit.id, payload)

    # 3. Assert
    assert time_log.id is not None
    assert time_log.habit_id == habit.id
    assert time_log.log_date == LOG_DATE_ONE
    assert time_log.minutes == MINUTES_LARGE
    assert time_log.source == "timer"
    stored = db_session.query(models.HabitTimeLog).all()
    assert len(stored) == 1


def test_list_time_logs_filters_by_date_range(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Read", category="Growth", tags=[])
    )
    crud.create_habit_time_log(
        db_session,
        habit.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_ONE, minutes=MINUTES_SMALL, source="manual"),
    )
    crud.create_habit_time_log(
        db_session,
        habit.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_TWO, minutes=MINUTES_MEDIUM, source="manual"),
    )
    crud.create_habit_time_log(
        db_session,
        habit.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_THREE, minutes=MINUTES_LARGE, source="timer"),
    )

    # 2. Act
    logs = crud.list_habit_time_logs(
        db_session, habit.id, start_date=LOG_DATE_TWO, end_date=LOG_DATE_THREE
    )

    # 3. Assert
    assert len(logs) == 2
    assert {log.log_date for log in logs} == {LOG_DATE_TWO, LOG_DATE_THREE}


def test_time_log_totals_sum_minutes_per_habit(db_session):
    # 1. Setup
    habit_one = crud.create_habit(
        db_session, schemas.HabitCreate(name="Code", category="Work", tags=[])
    )
    habit_two = crud.create_habit(
        db_session, schemas.HabitCreate(name="Walk", category="Health", tags=[])
    )
    crud.create_habit_time_log(
        db_session,
        habit_one.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_ONE, minutes=MINUTES_SMALL, source="timer"),
    )
    crud.create_habit_time_log(
        db_session,
        habit_one.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_TWO, minutes=MINUTES_MEDIUM, source="timer"),
    )
    crud.create_habit_time_log(
        db_session,
        habit_two.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_TWO, minutes=MINUTES_LARGE, source="manual"),
    )
    expected_habit_one_total = MINUTES_SMALL + MINUTES_MEDIUM
    expected_habit_two_total = MINUTES_LARGE

    # 2. Act
    totals = crud.get_habit_time_totals(
        db_session, start_date=LOG_DATE_ONE, end_date=LOG_DATE_TWO
    )

    # 3. Assert
    assert totals[habit_one.id] == expected_habit_one_total
    assert totals[habit_two.id] == expected_habit_two_total


def test_time_logs_deleted_with_habit(db_session):
    # 1. Setup
    habit = crud.create_habit(
        db_session, schemas.HabitCreate(name="Stretch", category="Health", tags=[])
    )
    crud.create_habit_time_log(
        db_session,
        habit.id,
        schemas.HabitTimeLogCreate(log_date=LOG_DATE_ONE, minutes=MINUTES_SMALL, source="manual"),
    )
    assert db_session.query(models.HabitTimeLog).count() == 1

    # 2. Act
    deleted = crud.delete_habit(db_session, habit.id)

    # 3. Assert
    assert deleted is True
    assert db_session.query(models.HabitTimeLog).count() == 0
