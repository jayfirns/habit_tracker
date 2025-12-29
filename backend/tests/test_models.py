import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date

# Adjusting import paths for testing context
import sys
import os
from os.path import abspath, dirname

# Add the 'backend' directory to sys.path
# This assumes test_models.py is in 'backend/tests'
# So, dirname(__file__) is 'backend/tests'
# dirname(dirname(__file__)) is 'backend'
sys.path.insert(0, abspath(dirname(dirname(__file__))))

from database import Base # Direct import from backend/database
from models import Habit, Completion # Direct import from backend/models

# Setup an in-memory SQLite database for testing
@pytest.fixture(scope="module")
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    Base.metadata.drop_all(bind=db_engine)
    Base.metadata.create_all(bind=db_engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

def test_create_habit(db_session):
    habit = Habit(name="Read Book", category="Personal Growth")
    db_session.add(habit)
    db_session.commit()
    db_session.refresh(habit)

    assert habit.id is not None
    assert habit.name == "Read Book"
    assert habit.category == "Personal Growth"
    assert habit.streak == 0
    assert habit.last_completed is None

def test_add_completion_to_habit(db_session):
    habit = Habit(name="Exercise", category="Health")
    db_session.add(habit)
    db_session.commit()
    db_session.refresh(habit)

    today = date.today().isoformat()
    completion = Completion(habit_id=habit.id, date=today, note="Morning workout")
    db_session.add(completion)
    db_session.commit()
    db_session.refresh(completion)

    assert completion.id is not None
    assert completion.habit_id == habit.id
    assert completion.date == today
    assert completion.note == "Morning workout"
    assert completion.habit.name == "Exercise" # Test relationship

def test_retrieve_habits_with_completions(db_session):
    habit1 = Habit(name="Code", category="Work")
    habit2 = Habit(name="Meditate", category="Wellness")
    db_session.add_all([habit1, habit2])
    db_session.commit()
    db_session.refresh(habit1)
    db_session.refresh(habit2)

    today = date.today().isoformat()
    completion1 = Completion(habit_id=habit1.id, date=today, note="Project X")
    completion2 = Completion(habit_id=habit1.id, date=today, note="Bug fix")
    db_session.add_all([completion1, completion2])
    db_session.commit()

    retrieved_habits = db_session.query(Habit).all()
    assert len(retrieved_habits) == 2

    for h in retrieved_habits:
        if h.name == "Code":
            assert len(h.completions) == 2
            assert h.completions[0].note == "Project X"
        elif h.name == "Meditate":
            assert len(h.completions) == 0
