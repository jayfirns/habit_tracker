from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import delete, func, or_, select
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
        delete(models.habit_goal_table).where(
            models.habit_goal_table.c.habit_id == habit_id
        )
    )
    db.execute(
        delete(models.HabitTimeLog).where(models.HabitTimeLog.habit_id == habit_id)
    )
    db.execute(
        delete(models.HabitTimer).where(models.HabitTimer.habit_id == habit_id)
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
        goal_id=completion_in.goal_id,
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


def create_habit_time_log(
    db: Session, habit_id: int, time_log_in: schemas.HabitTimeLogCreate
) -> Optional[models.HabitTimeLog]:
    habit = db.get(models.Habit, habit_id)
    if habit is None:
        return None

    time_log = db.scalars(
        select(models.HabitTimeLog).where(
            models.HabitTimeLog.habit_id == habit_id,
            models.HabitTimeLog.log_date == time_log_in.log_date,
        )
    ).first()
    if time_log is None:
        time_log = models.HabitTimeLog(
            habit_id=habit_id,
            log_date=time_log_in.log_date,
            minutes=time_log_in.minutes,
            source=time_log_in.source,
        )
    else:
        time_log.minutes = time_log_in.minutes
        time_log.source = time_log_in.source
    db.add(time_log)
    db.commit()
    db.refresh(time_log)
    return time_log


def list_habit_time_logs(
    db: Session,
    habit_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[models.HabitTimeLog]:
    statement = select(models.HabitTimeLog).where(models.HabitTimeLog.habit_id == habit_id)
    if start_date is not None:
        statement = statement.where(models.HabitTimeLog.log_date >= start_date)
    if end_date is not None:
        statement = statement.where(models.HabitTimeLog.log_date <= end_date)
    statement = statement.order_by(models.HabitTimeLog.log_date)
    return db.scalars(statement).all()


def list_all_time_logs(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[models.HabitTimeLog]:
    statement = select(models.HabitTimeLog)
    if start_date is not None:
        statement = statement.where(models.HabitTimeLog.log_date >= start_date)
    if end_date is not None:
        statement = statement.where(models.HabitTimeLog.log_date <= end_date)
    statement = statement.order_by(models.HabitTimeLog.log_date)
    return db.scalars(statement).all()


def start_habit_timer(
    db: Session, habit_id: int, timer_in: schemas.HabitTimerStart
) -> Optional[models.HabitTimer]:
    habit = db.get(models.Habit, habit_id)
    if habit is None:
        return None

    timer = db.scalars(
        select(models.HabitTimer).where(models.HabitTimer.habit_id == habit_id)
    ).first()
    if timer is None:
        timer = models.HabitTimer(
            habit_id=habit_id,
            started_at_ms=timer_in.started_at_ms,
        )
    else:
        timer.started_at_ms = timer_in.started_at_ms
    db.add(timer)
    db.commit()
    db.refresh(timer)
    return timer


def stop_habit_timer(db: Session, habit_id: int) -> bool:
    timer = db.scalars(
        select(models.HabitTimer).where(models.HabitTimer.habit_id == habit_id)
    ).first()
    if timer is None:
        return False
    db.delete(timer)
    db.commit()
    return True


def list_active_habit_timers(db: Session) -> List[models.HabitTimer]:
    statement = select(models.HabitTimer).order_by(models.HabitTimer.habit_id)
    return db.scalars(statement).all()


def get_habit_time_totals(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> dict[int, int]:
    statement = select(
        models.HabitTimeLog.habit_id,
        func.sum(models.HabitTimeLog.minutes),
    )
    if start_date is not None:
        statement = statement.where(models.HabitTimeLog.log_date >= start_date)
    if end_date is not None:
        statement = statement.where(models.HabitTimeLog.log_date <= end_date)
    statement = statement.group_by(models.HabitTimeLog.habit_id)
    results = db.execute(statement).all()
    return {habit_id: int(total or 0) for habit_id, total in results}


# SmartGoal CRUD
def list_goals(
    db: Session, quarter: Optional[str] = None, status: Optional[str] = None
) -> List[models.SmartGoal]:
    stmt = select(models.SmartGoal).options(selectinload(models.SmartGoal.habits))
    if quarter:
        stmt = stmt.where(models.SmartGoal.quarter == quarter)
    if status:
        stmt = stmt.where(models.SmartGoal.status == status)
    else:
        stmt = stmt.where(
            or_(models.SmartGoal.status.is_(None), models.SmartGoal.status != "archived")
        )
    return db.scalars(stmt).all()


def get_goal(db: Session, goal_id: int) -> Optional[models.SmartGoal]:
    stmt = (
        select(models.SmartGoal)
        .where(models.SmartGoal.id == goal_id)
        .options(selectinload(models.SmartGoal.habits))
    )
    return db.scalars(stmt).first()


def create_goal(db: Session, goal_in: schemas.SmartGoalCreate) -> models.SmartGoal:
    from datetime import datetime

    tags = [t.strip() for t in (goal_in.tags or []) if t.strip()]
    goal = models.SmartGoal(
        title=goal_in.title.strip(),
        why_this_matters=goal_in.why_this_matters,
        frequency=goal_in.frequency,
        frequency_period=goal_in.frequency_period,
        success_threshold=goal_in.success_threshold,
        quarter=goal_in.quarter,
        tags=tags,
        status=goal_in.status or "active",
        created_at=datetime.now().isoformat(),
    )

    if goal_in.habit_ids:
        goal.habits = db.scalars(
            select(models.Habit).where(models.Habit.id.in_(goal_in.habit_ids))
        ).all()

    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(
    db: Session, goal_id: int, goal_in: schemas.SmartGoalUpdate
) -> Optional[models.SmartGoal]:
    goal = db.get(models.SmartGoal, goal_id)
    if goal is None:
        return None

    if goal_in.title is not None:
        goal.title = goal_in.title.strip()
    if goal_in.why_this_matters is not None:
        goal.why_this_matters = goal_in.why_this_matters
    if goal_in.frequency is not None:
        goal.frequency = goal_in.frequency
    if goal_in.frequency_period is not None:
        goal.frequency_period = goal_in.frequency_period
    if goal_in.success_threshold is not None:
        goal.success_threshold = goal_in.success_threshold
    if goal_in.quarter is not None:
        goal.quarter = goal_in.quarter
    if goal_in.tags is not None:
        goal.tags = [t.strip() for t in goal_in.tags if t.strip()]
    if goal_in.habit_ids is not None:
        goal.habits = db.scalars(
            select(models.Habit).where(models.Habit.id.in_(goal_in.habit_ids))
        ).all()
    if goal_in.status is not None:
        goal.status = goal_in.status

    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal_id: int) -> bool:
    goal = db.get(models.SmartGoal, goal_id)
    if goal is None:
        return False
    goal.status = "archived"
    db.add(goal)
    db.commit()
    return True


def get_goal_progress(
    db: Session, goal_id: int, period_start: date, period_end: date
) -> Optional[schemas.SmartGoalProgress]:
    goal = get_goal(db, goal_id)
    if goal is None:
        return None

    # Count completions attributed to this goal in the period
    stmt = select(func.count(models.Completion.id)).where(
        models.Completion.goal_id == goal_id,
        models.Completion.date >= period_start.isoformat(),
        models.Completion.date <= period_end.isoformat(),
    )
    completed = db.scalar(stmt) or 0

    percentage = (completed / goal.frequency * 100) if goal.frequency > 0 else 0
    on_track = percentage >= goal.success_threshold

    return schemas.SmartGoalProgress(
        goal_id=goal_id,
        title=goal.title,
        period_start=period_start,
        period_end=period_end,
        target=goal.frequency,
        completed=completed,
        percentage=min(100.0, percentage),
        on_track=on_track,
    )


def get_quarterly_prompt(
    db: Session, today: date, user_name: str = "User"
) -> schemas.QuarterlyPrompt:
    quarter_num = (today.month - 1) // 3 + 1
    year = today.year
    quarter = f"Q{quarter_num} {year}"

    # Calculate days into quarter
    quarter_start_month = (quarter_num - 1) * 3 + 1
    quarter_start = date(year, quarter_start_month, 1)
    days_into = (today - quarter_start).days

    # Check if new quarter (first 7 days)
    is_new = days_into < 7

    # Get active goals count for this quarter
    goals = list_goals(db, quarter=quarter, status="active")
    active_count = len(goals)

    if is_new and active_count == 0:
        message = f"{user_name}, your {quarter} SMART Goals are due. Please complete your submission."
    elif is_new:
        message = f"{user_name}, {quarter} has begun. You have {active_count} active goals."
    elif days_into > 80:
        message = f"{user_name}, {quarter} ends soon. Time to reflect on your progress."
    else:
        message = f"{quarter} in progress. {active_count} active goals."

    return schemas.QuarterlyPrompt(
        quarter=quarter,
        message=message,
        is_new_quarter=is_new,
        days_into_quarter=days_into,
        active_goals_count=active_count,
    )


def get_weekly_summary(db: Session, today: date) -> List[schemas.SmartGoalProgress]:
    from datetime import timedelta

    # Calculate current week boundaries (Monday to Sunday)
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # Get all active goals with weekly frequency
    goals = list_goals(db, status="active")
    weekly_goals = [g for g in goals if g.frequency_period == "week"]

    result = []
    for goal in weekly_goals:
        progress = get_goal_progress(db, goal.id, week_start, week_end)
        if progress:
            result.append(progress)

    return result


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


# Workday state
def get_workday_state(db: Session) -> Optional[models.WorkdayState]:
    stmt = select(models.WorkdayState)
    return db.scalars(stmt).first()


def save_workday_state(
    db: Session, workday_in: schemas.WorkdayStateUpdate
) -> models.WorkdayState:
    state = get_workday_state(db)
    workday_date = (
        workday_in.workday_date.isoformat()
        if workday_in.workday_date
        else date.today().isoformat()
    )
    if state is None:
        state = models.WorkdayState(
            workday_date=workday_date,
            planned_start=workday_in.planned_start or "09:00",
        )
        db.add(state)

    state.workday_date = workday_date
    state.planned_start = workday_in.planned_start or "09:00"
    state.planned_minutes = workday_in.planned_minutes
    state.clock_in_at = workday_in.clock_in_at
    state.clock_out_at = workday_in.clock_out_at
    state.worked_minutes_override = workday_in.worked_minutes_override

    db.add(state)
    db.commit()
    db.refresh(state)
    return state
