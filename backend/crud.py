from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import delete, or_, select
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
    db.execute(
        delete(models.habit_milestone_table).where(
            models.habit_milestone_table.c.habit_id == habit_id
        )
    )
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


# Milestone CRUD
def list_milestones(db: Session) -> List[models.Milestone]:
    stmt = (
        select(models.Milestone)
        .where(or_(models.Milestone.status.is_(None), models.Milestone.status != "archived"))
        .options(selectinload(models.Milestone.habits))
    )
    return db.scalars(stmt).all()


def get_milestone(db: Session, milestone_id: int) -> Optional[models.Milestone]:
    stmt = (
        select(models.Milestone)
        .where(models.Milestone.id == milestone_id)
        .options(selectinload(models.Milestone.habits))
    )
    return db.scalars(stmt).first()


def create_milestone(db: Session, milestone_in: schemas.MilestoneCreate) -> models.Milestone:
    tags = [t.strip() for t in (milestone_in.tags or []) if t.strip()]
    milestone = models.Milestone(
        title=milestone_in.title.strip(),
        description=milestone_in.description,
        outcome=milestone_in.outcome,
        scope=milestone_in.scope,
        start_date=milestone_in.start_date.isoformat() if milestone_in.start_date else None,
        due_date=milestone_in.due_date.isoformat() if milestone_in.due_date else None,
        tags=tags,
        status=milestone_in.status or "active",
    )

    if milestone_in.habit_ids:
        milestone.habits = db.scalars(
            select(models.Habit).where(models.Habit.id.in_(milestone_in.habit_ids))
        ).all()

    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


def update_milestone(
    db: Session, milestone_id: int, milestone_in: schemas.MilestoneUpdate
) -> Optional[models.Milestone]:
    milestone = db.get(models.Milestone, milestone_id)
    if milestone is None:
        return None

    for field in ["title", "description", "outcome", "scope"]:
        value = getattr(milestone_in, field, None)
        if value is not None:
            setattr(milestone, field, value.strip() if isinstance(value, str) else value)

    if milestone_in.start_date is not None:
        milestone.start_date = (
            milestone_in.start_date.isoformat() if milestone_in.start_date else None
        )
    if milestone_in.due_date is not None:
        milestone.due_date = milestone_in.due_date.isoformat() if milestone_in.due_date else None
    if milestone_in.tags is not None:
        milestone.tags = [t.strip() for t in milestone_in.tags if t.strip()]
    if milestone_in.habit_ids is not None:
        milestone.habits = db.scalars(
            select(models.Habit).where(models.Habit.id.in_(milestone_in.habit_ids))
        ).all()
    if milestone_in.status is not None:
        milestone.status = milestone_in.status

    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


def delete_milestone(db: Session, milestone_id: int) -> bool:
    milestone = db.get(models.Milestone, milestone_id)
    if milestone is None:
        return False
    milestone.status = "archived"
    db.add(milestone)
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
        milestone_id=reflection_in.milestone_id,
        rating=reflection_in.rating,
    )
    db.add(reflection)
    db.commit()
    db.refresh(reflection)
    return reflection


# Workday state
def get_workday_state(db: Session) -> Optional[models.WorkdayState]:
    stmt = select(models.WorkdayState)
    return db.scalars(stmt).first()


def save_workday_state(
    db: Session, workday_in: schemas.WorkdayStateUpdate
) -> models.WorkdayState:
    state = get_workday_state(db)
    if state is None:
        state = models.WorkdayState(planned_start=workday_in.planned_start or "09:00")
        db.add(state)

    state.planned_start = workday_in.planned_start or "09:00"
    state.planned_minutes = workday_in.planned_minutes
    state.clock_in_at = workday_in.clock_in_at
    state.clock_out_at = workday_in.clock_out_at
    state.worked_minutes_override = workday_in.worked_minutes_override

    db.add(state)
    db.commit()
    db.refresh(state)
    return state
