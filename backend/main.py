import logging
import time
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import crud
import models
import schemas
from database import Base, engine, get_db

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
)
logger = logging.getLogger("focusos.api")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FocusOS Backend")

frontend_dir = Path(__file__).parent / "frontend"
if frontend_dir.exists():
    app.mount("/ui", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/")
async def read_root():
    return {"message": "Welcome to FocusOS Backend!"}


@app.middleware("http")
async def log_requests(request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = (time.monotonic() - start) * 1000
    logger.info(
        "%s %s -> %s (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.post("/habits", response_model=schemas.HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(habit: schemas.HabitCreate, db: Session = Depends(get_db)):
    return crud.create_habit(db, habit)


@app.get("/habits", response_model=list[schemas.HabitRead])
def list_habits(db: Session = Depends(get_db)):
    return crud.list_habits(db)


@app.get("/habits/{habit_id}", response_model=schemas.HabitRead)
def get_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return habit


@app.put("/habits/{habit_id}", response_model=schemas.HabitRead)
def update_habit(habit_id: int, habit: schemas.HabitUpdate, db: Session = Depends(get_db)):
    updated = crud.update_habit(db, habit_id, habit)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return updated


@app.delete("/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_habit(db, habit_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/habits/{habit_id}/complete",
    response_model=schemas.CompletionRead,
    status_code=status.HTTP_201_CREATED,
)
def complete_habit(
    habit_id: int, completion: schemas.CompletionCreate, db: Session = Depends(get_db)
):
    # Validate goal_id if provided
    if completion.goal_id is not None:
        goal = crud.get_goal(db, completion.goal_id)
        if goal is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Goal not found")

    result = crud.create_completion(db, habit_id, completion)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    created_completion, _habit = result
    return created_completion


@app.get("/habits/{habit_id}/completions", response_model=list[schemas.CompletionRead])
def list_completions(habit_id: int, db: Session = Depends(get_db)):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return crud.list_completions(db, habit_id)


@app.post(
    "/habits/{habit_id}/time-logs",
    response_model=schemas.HabitTimeLogRead,
    status_code=status.HTTP_201_CREATED,
)
def create_time_log(
    habit_id: int,
    time_log: schemas.HabitTimeLogCreate,
    db: Session = Depends(get_db),
):
    created = crud.create_habit_time_log(db, habit_id, time_log)
    if created is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return created


@app.get(
    "/habits/{habit_id}/time-logs",
    response_model=list[schemas.HabitTimeLogRead],
)
def list_time_logs(
    habit_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return crud.list_habit_time_logs(db, habit_id, start_date=start_date, end_date=end_date)


@app.get("/time-logs/totals", response_model=dict[int, int])
def get_time_totals(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_habit_time_totals(db, start_date=start_date, end_date=end_date)


@app.get("/time-logs", response_model=list[schemas.HabitTimeLogRead])
def list_all_time_logs(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_all_time_logs(db, start_date=start_date, end_date=end_date)


@app.post(
    "/habits/{habit_id}/timer/start",
    response_model=schemas.HabitTimerRead,
    status_code=status.HTTP_201_CREATED,
)
def start_habit_timer(
    habit_id: int,
    timer: schemas.HabitTimerStart,
    db: Session = Depends(get_db),
):
    started = crud.start_habit_timer(db, habit_id, timer)
    if started is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return started


@app.post("/habits/{habit_id}/timer/stop", status_code=status.HTTP_204_NO_CONTENT)
def stop_habit_timer(habit_id: int, db: Session = Depends(get_db)):
    stopped = crud.stop_habit_timer(db, habit_id)
    if not stopped:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timer not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/timers", response_model=list[schemas.HabitTimerRead])
def list_active_timers(db: Session = Depends(get_db)):
    return crud.list_active_habit_timers(db)


@app.get("/goals", response_model=list[schemas.SmartGoalRead])
def list_goals(
    quarter: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_goals(db, quarter=quarter, status=status_filter)


@app.get("/goals/weekly-summary", response_model=list[schemas.SmartGoalProgress])
def get_weekly_summary(db: Session = Depends(get_db)):
    return crud.get_weekly_summary(db, date.today())


@app.get("/goals/{goal_id}", response_model=schemas.SmartGoalRead)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = crud.get_goal(db, goal_id)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


@app.get("/goals/{goal_id}/progress", response_model=schemas.SmartGoalProgress)
def get_goal_progress(goal_id: int, db: Session = Depends(get_db)):
    from datetime import timedelta

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    progress = crud.get_goal_progress(db, goal_id, week_start, week_end)
    if progress is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return progress


@app.post("/goals", response_model=schemas.SmartGoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(goal: schemas.SmartGoalCreate, db: Session = Depends(get_db)):
    return crud.create_goal(db, goal)


@app.put("/goals/{goal_id}", response_model=schemas.SmartGoalRead)
def update_goal(goal_id: int, goal: schemas.SmartGoalUpdate, db: Session = Depends(get_db)):
    updated = crud.update_goal(db, goal_id, goal)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return updated


@app.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_goal(db, goal_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/quarterly-prompt", response_model=schemas.QuarterlyPrompt)
def get_quarterly_prompt(db: Session = Depends(get_db)):
    return crud.get_quarterly_prompt(db, date.today(), "John")


@app.get("/reflections", response_model=list[schemas.ReflectionRead])
def list_reflections(reflection_type: str | None = None, db: Session = Depends(get_db)):
    return crud.list_reflections(db, reflection_type)


@app.post("/reflections", response_model=schemas.ReflectionRead, status_code=status.HTTP_201_CREATED)
def create_reflection(reflection: schemas.ReflectionCreate, db: Session = Depends(get_db)):
    return crud.create_reflection(db, reflection)


@app.get("/workday", response_model=schemas.WorkdayStateRead)
def get_workday_state(db: Session = Depends(get_db)):
    state = crud.get_workday_state(db)
    if state is None:
        state = crud.save_workday_state(db, schemas.WorkdayStateUpdate())
    return state


@app.put("/workday", response_model=schemas.WorkdayStateRead)
def update_workday_state(
    workday: schemas.WorkdayStateUpdate, db: Session = Depends(get_db)
):
    return crud.save_workday_state(db, workday)
