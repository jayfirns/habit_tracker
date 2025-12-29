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
    habit = models.Habit(
        name=habit_in.name.strip(),
        category=habit_in.category.strip(),
        streak=0,
        last_completed=None,
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
