import logging
import os
import time
import bcrypt
import re
from collections import defaultdict
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

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

SESSION_SECRET = os.environ.get('SESSION_SECRET', os.urandom(32).hex())
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

HT_USER = os.environ.get('HT_USER', '')
HT_HASH = os.environ.get('HT_HASH', '')

# Simple rate limiter for login
_login_attempts = defaultdict(list)
LOGIN_LIMIT = 5
LOGIN_WINDOW = 60


class LoginRequest(BaseModel):
    username: str
    password: str


def require_auth(request: Request):
    if not request.session.get('user'):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Authentication required")


# Serve login page
login_html_path = Path(__file__).parent / "login.html"


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if request.session.get('user'):
        return RedirectResponse(url="/ui/", status_code=302)
    return HTMLResponse(login_html_path.read_text())


@app.post("/auth/login")
async def auth_login(request: Request, creds: LoginRequest):
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    _login_attempts[client_ip] = [t for t in _login_attempts[client_ip] if now - t < LOGIN_WINDOW]
    if len(_login_attempts[client_ip]) >= LOGIN_LIMIT:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
    _login_attempts[client_ip].append(now)

    if creds.username == HT_USER and HT_HASH:
        if bcrypt.checkpw(creds.password.encode('utf-8'), HT_HASH.encode('utf-8')):
            request.session['user'] = creds.username
            return {"status": "ok"}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid credentials")


@app.get("/auth/logout")
async def auth_logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=302)



class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@app.post("/auth/change-password", dependencies=[Depends(require_auth)])
async def change_password(req: ChangePasswordRequest):
    global HT_HASH

    if not HT_HASH or not bcrypt.checkpw(req.current_password.encode('utf-8'), HT_HASH.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Current password is incorrect")

    new_hash = bcrypt.hashpw(req.new_password.encode('utf-8'), bcrypt.gensalt()).decode()
    HT_HASH = new_hash

    env_path = Path(__file__).parent / '.env'
    env_content = env_path.read_text()
    env_content = re.sub(r'^HT_HASH=.*$', f'HT_HASH={new_hash}', env_content, flags=re.MULTILINE)
    env_path.write_text(env_content)

    return {"status": "ok"}


frontend_dir = Path(__file__).parent / "frontend"
if frontend_dir.exists():
    app.mount("/ui", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/")
async def read_root(request: Request):
    if not request.session.get('user'):
        return RedirectResponse(url="/login", status_code=302)
    return RedirectResponse(url="/ui/", status_code=302)


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


@app.post("/habits", response_model=schemas.HabitRead, status_code=status.HTTP_201_CREATED,
          dependencies=[Depends(require_auth)])
def create_habit(habit: schemas.HabitCreate, db: Session = Depends(get_db)):
    return crud.create_habit(db, habit)


@app.get("/habits", response_model=list[schemas.HabitRead],
         dependencies=[Depends(require_auth)])
def list_habits(db: Session = Depends(get_db)):
    return crud.list_habits(db)


@app.get("/habits/{habit_id}", response_model=schemas.HabitRead,
         dependencies=[Depends(require_auth)])
def get_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return habit


@app.put("/habits/{habit_id}", response_model=schemas.HabitRead,
         dependencies=[Depends(require_auth)])
def update_habit(habit_id: int, habit: schemas.HabitUpdate, db: Session = Depends(get_db)):
    updated = crud.update_habit(db, habit_id, habit)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return updated


@app.delete("/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT,
            dependencies=[Depends(require_auth)])
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_habit(db, habit_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/habits/{habit_id}/complete",
    response_model=schemas.CompletionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_auth)],
)
def complete_habit(
    habit_id: int, completion: schemas.CompletionCreate, db: Session = Depends(get_db)
):
    result = crud.create_completion(db, habit_id, completion)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    created_completion, _habit = result
    return created_completion


@app.get("/habits/{habit_id}/completions", response_model=list[schemas.CompletionRead],
         dependencies=[Depends(require_auth)])
def list_completions(habit_id: int, db: Session = Depends(get_db)):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return crud.list_completions(db, habit_id)


@app.get("/goals", response_model=list[schemas.GoalRead],
         dependencies=[Depends(require_auth)])
def list_goals(db: Session = Depends(get_db)):
    return crud.list_goals(db)


@app.get("/goals/{goal_id}", response_model=schemas.GoalRead,
         dependencies=[Depends(require_auth)])
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = crud.get_goal(db, goal_id)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


@app.post("/goals", response_model=schemas.GoalRead, status_code=status.HTTP_201_CREATED,
          dependencies=[Depends(require_auth)])
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    return crud.create_goal(db, goal)


@app.put("/goals/{goal_id}", response_model=schemas.GoalRead,
         dependencies=[Depends(require_auth)])
def update_goal(goal_id: int, goal: schemas.GoalUpdate, db: Session = Depends(get_db)):
    updated = crud.update_goal(db, goal_id, goal)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return updated


@app.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT,
            dependencies=[Depends(require_auth)])
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_goal(db, goal_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/reflections", response_model=list[schemas.ReflectionRead],
         dependencies=[Depends(require_auth)])
def list_reflections(reflection_type: str | None = None, db: Session = Depends(get_db)):
    return crud.list_reflections(db, reflection_type)


@app.post("/reflections", response_model=schemas.ReflectionRead,
          status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_auth)])
def create_reflection(reflection: schemas.ReflectionCreate, db: Session = Depends(get_db)):
    return crud.create_reflection(db, reflection)
