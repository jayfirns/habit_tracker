import os
import sys
from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import schemas  # noqa: E402
from database import Base  # noqa: E402
import models  # noqa: E402
import crud  # noqa: E402
from main import (  # noqa: E402
    create_goal,
    create_habit,
    create_reflection,
    delete_goal,
    list_goals,
    update_goal,
    get_goal,
    get_goal_progress,
    get_weekly_summary,
    get_quarterly_prompt,
    complete_habit,
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


def test_create_goal_with_all_smart_fields(db_session):
    habit = create_habit(schemas.HabitCreate(name="Run", category="Fitness"), db_session)
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Build fitness habit",
            why_this_matters="I want more energy and to age well",
            frequency=3,
            frequency_period="week",
            success_threshold=80,
            quarter="Q1 2026",
            tags=["health", "energy"],
            habit_ids=[habit.id],
            status="active",
        ),
        db_session,
    )

    assert goal.id is not None
    assert goal.title == "Build fitness habit"
    assert goal.why_this_matters == "I want more energy and to age well"
    assert goal.frequency == 3
    assert goal.frequency_period == "week"
    assert goal.success_threshold == 80
    assert goal.quarter == "Q1 2026"
    assert goal.tags == ["health", "energy"]
    assert goal.habits[0].id == habit.id
    assert goal.status == "active"
    assert goal.created_at is not None


def test_create_goal_with_habit_links(db_session):
    habit1 = create_habit(schemas.HabitCreate(name="Bike", category="Fitness"), db_session)
    habit2 = create_habit(schemas.HabitCreate(name="Swim", category="Fitness"), db_session)

    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Fitness",
            frequency=3,
            quarter="Q1 2026",
            habit_ids=[habit1.id, habit2.id],
        ),
        db_session,
    )

    assert len(goal.habits) == 2
    habit_ids = [h.id for h in goal.habits]
    assert habit1.id in habit_ids
    assert habit2.id in habit_ids


def test_goal_frequency_validation(db_session):
    with pytest.raises(Exception):
        create_goal(
            schemas.SmartGoalCreate(
                title="Invalid",
                frequency=0,  # Must be >= 1
                quarter="Q1 2026",
            ),
            db_session,
        )


def test_goal_success_threshold_validation(db_session):
    with pytest.raises(Exception):
        create_goal(
            schemas.SmartGoalCreate(
                title="Invalid",
                frequency=3,
                success_threshold=150,  # Must be 0-100
                quarter="Q1 2026",
            ),
            db_session,
        )


def test_list_goals_excludes_archived(db_session):
    goal1 = create_goal(
        schemas.SmartGoalCreate(
            title="Active Goal",
            frequency=3,
            quarter="Q1 2026",
            status="active",
        ),
        db_session,
    )
    goal2 = create_goal(
        schemas.SmartGoalCreate(
            title="Archived Goal",
            frequency=3,
            quarter="Q1 2026",
            status="archived",
        ),
        db_session,
    )

    goals = crud.list_goals(db_session)
    assert len(goals) == 1
    assert goals[0].id == goal1.id


def test_list_goals_filters_by_quarter(db_session):
    goal_q1 = create_goal(
        schemas.SmartGoalCreate(
            title="Q1 Goal",
            frequency=3,
            quarter="Q1 2026",
        ),
        db_session,
    )
    goal_q2 = create_goal(
        schemas.SmartGoalCreate(
            title="Q2 Goal",
            frequency=3,
            quarter="Q2 2026",
        ),
        db_session,
    )

    goals = crud.list_goals(db_session, quarter="Q1 2026")
    assert len(goals) == 1
    assert goals[0].id == goal_q1.id


def test_delete_goal_soft_archives(db_session):
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="To Archive",
            frequency=3,
            quarter="Q1 2026",
        ),
        db_session,
    )

    response = delete_goal(goal.id, db_session)
    assert response.status_code == 204

    assert crud.list_goals(db_session) == []
    archived = db_session.get(models.SmartGoal, goal.id)
    assert archived is not None
    assert archived.status == "archived"


def test_update_goal_fields(db_session):
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Original",
            frequency=3,
            quarter="Q1 2026",
        ),
        db_session,
    )

    updated = update_goal(
        goal.id,
        schemas.SmartGoalUpdate(
            title="Updated",
            frequency=5,
            why_this_matters="New reason",
        ),
        db_session,
    )

    assert updated.title == "Updated"
    assert updated.frequency == 5
    assert updated.why_this_matters == "New reason"


def test_completion_with_goal_attribution(db_session):
    habit = create_habit(schemas.HabitCreate(name="Run", category="Fitness"), db_session)
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Fitness",
            frequency=3,
            quarter="Q1 2026",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    completion = complete_habit(
        habit.id,
        schemas.CompletionCreate(
            date=date.today(),
            note="Morning run",
            goal_id=goal.id,
        ),
        db_session,
    )

    assert completion.goal_id == goal.id


def test_completion_without_goal_attribution(db_session):
    habit = create_habit(schemas.HabitCreate(name="Read", category="Enrichment"), db_session)

    completion = complete_habit(
        habit.id,
        schemas.CompletionCreate(
            date=date.today(),
            note="Read a chapter",
        ),
        db_session,
    )

    assert completion.goal_id is None


def test_goal_progress_calculation(db_session):
    habit = create_habit(schemas.HabitCreate(name="Run", category="Fitness"), db_session)
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Fitness",
            frequency=3,
            quarter="Q1 2026",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    # Log 2 completions toward this goal
    complete_habit(
        habit.id,
        schemas.CompletionCreate(date=week_start, goal_id=goal.id),
        db_session,
    )
    complete_habit(
        habit.id,
        schemas.CompletionCreate(date=week_start + timedelta(days=1), goal_id=goal.id),
        db_session,
    )

    progress = get_goal_progress(goal.id, db_session)

    assert progress.goal_id == goal.id
    assert progress.target == 3
    assert progress.completed == 2
    assert progress.percentage == pytest.approx(66.67, rel=0.1)
    assert progress.on_track is False  # 66% < 80% threshold


def test_goal_progress_on_track_threshold(db_session):
    habit = create_habit(schemas.HabitCreate(name="Run", category="Fitness"), db_session)
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Fitness",
            frequency=3,
            success_threshold=50,  # Lower threshold
            quarter="Q1 2026",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    # Log 2 completions
    complete_habit(
        habit.id,
        schemas.CompletionCreate(date=week_start, goal_id=goal.id),
        db_session,
    )
    complete_habit(
        habit.id,
        schemas.CompletionCreate(date=week_start + timedelta(days=1), goal_id=goal.id),
        db_session,
    )

    progress = get_goal_progress(goal.id, db_session)

    assert progress.on_track is True  # 66% >= 50% threshold


def test_weekly_summary_aggregation(db_session):
    habit1 = create_habit(schemas.HabitCreate(name="Run", category="Fitness"), db_session)
    habit2 = create_habit(schemas.HabitCreate(name="Read", category="Enrichment"), db_session)

    goal1 = create_goal(
        schemas.SmartGoalCreate(
            title="Fitness",
            frequency=3,
            frequency_period="week",
            quarter="Q1 2026",
            habit_ids=[habit1.id],
        ),
        db_session,
    )
    goal2 = create_goal(
        schemas.SmartGoalCreate(
            title="Enrichment",
            frequency=5,
            frequency_period="week",
            quarter="Q1 2026",
            habit_ids=[habit2.id],
        ),
        db_session,
    )

    summary = get_weekly_summary(db_session)

    assert len(summary) == 2
    goal_ids = [s.goal_id for s in summary]
    assert goal1.id in goal_ids
    assert goal2.id in goal_ids


def test_weekly_summary_excludes_monthly_goals(db_session):
    habit = create_habit(schemas.HabitCreate(name="Review", category="Work"), db_session)

    create_goal(
        schemas.SmartGoalCreate(
            title="Monthly Review",
            frequency=1,
            frequency_period="month",
            quarter="Q1 2026",
            habit_ids=[habit.id],
        ),
        db_session,
    )

    summary = get_weekly_summary(db_session)
    assert len(summary) == 0


def test_quarterly_prompt_new_quarter(db_session):
    # Test with a date in the first week of Q1
    test_date = date(2026, 1, 3)  # January 3rd
    prompt = crud.get_quarterly_prompt(db_session, test_date, "John")

    assert prompt.quarter == "Q1 2026"
    assert prompt.is_new_quarter is True
    assert "John" in prompt.message
    assert "SMART Goals are due" in prompt.message


def test_quarterly_prompt_mid_quarter(db_session):
    # Test with a date in the middle of Q1
    test_date = date(2026, 2, 15)  # February 15th
    prompt = crud.get_quarterly_prompt(db_session, test_date, "John")

    assert prompt.quarter == "Q1 2026"
    assert prompt.is_new_quarter is False
    assert "in progress" in prompt.message


def test_quarterly_prompt_end_of_quarter(db_session):
    # Test with a date near the end of Q1
    test_date = date(2026, 3, 25)  # March 25th (> 80 days into quarter)
    prompt = crud.get_quarterly_prompt(db_session, test_date, "John")

    assert prompt.quarter == "Q1 2026"
    assert prompt.is_new_quarter is False
    assert "ends soon" in prompt.message


def test_reflection_with_goal_link(db_session):
    goal = create_goal(
        schemas.SmartGoalCreate(
            title="Fitness",
            frequency=3,
            quarter="Q1 2026",
        ),
        db_session,
    )

    reflection = create_reflection(
        schemas.ReflectionCreate(
            reflection_type="quarter",
            period_label="Q1 2026",
            prompts=["What worked?", "What didn't?"],
            responses=["Consistency", "Weather"],
            goal_id=goal.id,
            rating="on_track",
        ),
        db_session,
    )

    assert reflection.id is not None
    assert reflection.goal_id == goal.id
    assert reflection.rating == "on_track"
