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
import models  # noqa: E402
from main import (  # noqa: E402
    create_goal,
    create_habit,
    create_reflection,
    delete_goal,
    list_goals,
    update_goal,
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
            status="active",
        ),
        db_session,
    )

    assert goal.id is not None
    assert goal.scope == "quarter"
    assert goal.tags == ["writing"]
    assert goal.habits[0].id == habit.id
    assert goal.status == "active"

    goals = list_goals(db_session)
    assert len(goals) == 1


def test_reflection_with_goal_link(db_session):
    habit = create_habit(schemas.HabitCreate(name="Plan", category="Work"), db_session)
    goal = create_goal(
        schemas.GoalCreate(
            title="Plan Q1",
            scope="quarter",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    reflection = create_reflection(
        schemas.ReflectionCreate(
            reflection_type="month",
            period_label="2025-01",
            responses=["On track"],
            prompts=["Status"],
            goal_id=goal.id,
            rating="on_track",
        ),
        db_session,
    )

    assert reflection.id is not None
    assert reflection.goal_id == goal.id
    assert reflection.rating == "on_track"


def test_delete_active_goal_soft_archives_and_hides_from_list(db_session):
    goal = create_goal(
        schemas.GoalCreate(
            title="Ship Release",
            scope="quarter",
            status="active",
        ),
        db_session,
    )

    response = delete_goal(goal.id, db_session)
    assert response.status_code == 204

    assert list_goals(db_session) == []
    archived = db_session.get(models.Goal, goal.id)
    assert archived is not None
    assert archived.status == "archived"


def test_delete_completed_goal_soft_archives_and_hides_from_list(db_session):
    goal = create_goal(
        schemas.GoalCreate(
            title="Close OKRs",
            scope="quarter",
            status="complete",
        ),
        db_session,
    )

    response = delete_goal(goal.id, db_session)
    assert response.status_code == 204

    assert list_goals(db_session) == []
    archived = db_session.get(models.Goal, goal.id)
    assert archived is not None
    assert archived.status == "archived"


def test_modify_completed_goal_allows_status_reversal(db_session):
    goal = create_goal(
        schemas.GoalCreate(
            title="Write Retrospective",
            scope="quarter",
            status="complete",
        ),
        db_session,
    )

    updated = update_goal(
        goal.id,
        schemas.GoalUpdate(title="Rewrite Retrospective", status="active"),
        db_session,
    )

    assert updated.title == "Rewrite Retrospective"
    assert updated.status == "active"
    goals = list_goals(db_session)
    assert len(goals) == 1
    assert goals[0].id == goal.id
