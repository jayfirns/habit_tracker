import os
import sys
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import schemas  # noqa: E402
from database import Base  # noqa: E402
from main import create_goal, create_habit, list_goals  # noqa: E402

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


def test_create_goal_with_habit_link(db_session):
    habit = create_habit(schemas.HabitCreate(name="Write", category="Work"), db_session)
    goal = create_goal(
        schemas.GoalCreate(
            title="Publish Article",
            description="Draft and publish",
            outcome="Article live",
            scope="quarter",
            start_date=date.today(),
            due_date=date.today(),
            tags=["writing"],
            habit_ids=[habit.id],
        ),
        db_session,
    )

    assert goal.id is not None
    assert goal.scope == "quarter"
    assert goal.tags == ["writing"]
    assert goal.habits[0].id == habit.id

    goals = list_goals(db_session)
    assert len(goals) == 1
