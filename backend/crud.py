from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

import models
import schemas


def list_habits(db: Session) -> List[models.Habit]:
    statement = select(models.Habit).options(
        selectinload(models.Habit.completions)
    )
    return db.scalars(statement).all()


def get_habit(db: Session, habit_id: int) -> Optional[models.Habit]:
    statement = (
        select(models.Habit)
        .where(models.Habit.id == habit_id)
        .options(selectinload(models.Habit.completions))
    )
    return db.scalars(statement).first()


def create_habit(db: Session, habit_in: schemas.HabitCreate) -> models.Habit:
    tags = [t.strip() for t in (habit_in.tags or []) if t.strip()]
    habit = models.Habit(
        name=habit_in.name.strip(),
        category=habit_in.category.strip(),
        streak=0,
        last_completed=None,
        tags=tags,
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def update_habit(
    db: Session, habit_id: int, habit_in: schemas.HabitUpdate
) -> Optional[models.Habit]:
    habit = db.get(models.Habit, habit_id)
    if habit is None:
        return None

    if habit_in.name is not None:
        habit.name = habit_in.name.strip()
    if habit_in.category is not None:
        habit.category = habit_in.category.strip()
    if habit_in.tags is not None:
        habit.tags = [t.strip() for t in habit_in.tags if t.strip()]

    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def delete_habit(db: Session, habit_id: int) -> bool:
    habit = db.get(models.Habit, habit_id)
    if habit is None:
        return False
    db.delete(habit)
    db.commit()
    return True


def _update_streak(habit: models.Habit, completed_on: date) -> None:
    if habit.last_completed:
        last_date = date.fromisoformat(habit.last_completed)
        delta_days = (completed_on - last_date).days
        if delta_days == 1:
            habit.streak = (habit.streak or 0) + 1
        elif delta_days == 0:
            habit.streak = habit.streak or 1
        else:
            habit.streak = 1
    else:
        habit.streak = 1

    habit.last_completed = completed_on.isoformat()


def create_completion(
    db: Session, habit_id: int, completion_in: schemas.CompletionCreate
) -> Optional[Tuple[models.Completion, models.Habit]]:
    habit = db.get(models.Habit, habit_id)
    if habit is None:
        return None

    completion_date = completion_in.date or date.today()
    completion = models.Completion(
        habit_id=habit_id,
        date=completion_date.isoformat(),
        note=completion_in.note,
    )
    db.add(completion)

    _update_streak(habit, completion_date)
    db.add(habit)

    db.commit()
    db.refresh(completion)
    db.refresh(habit)
    return completion, habit


def list_completions(db: Session, habit_id: int) -> List[models.Completion]:
    statement = (
        select(models.Completion)
        .where(models.Completion.habit_id == habit_id)
        .order_by(models.Completion.date)
    )
    return db.scalars(statement).all()


# Goal CRUD
def list_goals(db: Session) -> List[models.Goal]:
    stmt = select(models.Goal).options(selectinload(models.Goal.habits))
    return db.scalars(stmt).all()


def get_goal(db: Session, goal_id: int) -> Optional[models.Goal]:
    stmt = select(models.Goal).where(models.Goal.id == goal_id).options(selectinload(models.Goal.habits))
    return db.scalars(stmt).first()


def create_goal(db: Session, goal_in: schemas.GoalCreate) -> models.Goal:
    tags = [t.strip() for t in (goal_in.tags or []) if t.strip()]
    goal = models.Goal(
        title=goal_in.title.strip(),
        description=goal_in.description,
        outcome=goal_in.outcome,
        scope=goal_in.scope,
        start_date=goal_in.start_date.isoformat() if goal_in.start_date else None,
        due_date=goal_in.due_date.isoformat() if goal_in.due_date else None,
        tags=tags,
        status=goal_in.status or "active",
    )

    if goal_in.habit_ids:
        goal.habits = db.scalars(select(models.Habit).where(models.Habit.id.in_(goal_in.habit_ids))).all()

    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(db: Session, goal_id: int, goal_in: schemas.GoalUpdate) -> Optional[models.Goal]:
    goal = db.get(models.Goal, goal_id)
    if goal is None:
        return None

    for field in ["title", "description", "outcome", "scope"]:
        value = getattr(goal_in, field, None)
        if value is not None:
            setattr(goal, field, value.strip() if isinstance(value, str) else value)

    if goal_in.start_date is not None:
        goal.start_date = goal_in.start_date.isoformat() if goal_in.start_date else None
    if goal_in.due_date is not None:
        goal.due_date = goal_in.due_date.isoformat() if goal_in.due_date else None
    if goal_in.tags is not None:
        goal.tags = [t.strip() for t in goal_in.tags if t.strip()]
    if goal_in.habit_ids is not None:
        goal.habits = db.scalars(select(models.Habit).where(models.Habit.id.in_(goal_in.habit_ids))).all()
    if goal_in.status is not None:
        goal.status = goal_in.status

    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal_id: int) -> bool:
    goal = db.get(models.Goal, goal_id)
    if goal is None:
        return False
    db.delete(goal)
    db.commit()
    return True


# Reflections
def list_reflections(db: Session, reflection_type: Optional[str] = None) -> List[models.Reflection]:
    stmt = select(models.Reflection)
    if reflection_type:
        stmt = stmt.where(models.Reflection.reflection_type == reflection_type)
    return db.scalars(stmt).all()


def create_reflection(db: Session, reflection_in: schemas.ReflectionCreate) -> models.Reflection:
    reflection = models.Reflection(
        reflection_type=reflection_in.reflection_type,
        period_label=reflection_in.period_label,
        prompts=reflection_in.prompts,
        responses=reflection_in.responses,
        submitted_at=reflection_in.submitted_at.isoformat() if reflection_in.submitted_at else None,
        goal_id=reflection_in.goal_id,
        rating=reflection_in.rating,
    )
    db.add(reflection)
    db.commit()
    db.refresh(reflection)
    return reflection
