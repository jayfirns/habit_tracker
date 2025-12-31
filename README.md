# FocusOS Habit Tracker

FastAPI backend with a lightweight HTML/JS frontend for local-first habit, milestone, and reflection tracking. Data is stored in SQLite by default and can be swapped via `DATABASE_URL`.

## Features

- Habit CRUD with completion history, streaks, and tags
- Milestones linked to habits plus reflections scoped to milestones
- Simple web UI served from the backend at `/ui`
- Local SQLite persistence (`backend/data/habit_tracker.db` by default)

## Quickstart (dev)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .[dev]
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- UI: http://localhost:8000/ui
- Default DB: `backend/data/habit_tracker.db` (override with `DATABASE_URL`)

## Docker

- Build: `docker build -f backend/Dockerfile -t focusos-backend backend`
- Run: `docker run -p 8000:8000 focusos-backend`
- Compose: `docker-compose up --build backend` (bind-mounts `backend/data` for persistence)

## Tests

From `backend`:

```bash
pytest tests
```

CI runs on `push` to `main` and all PRs: Python 3.11 tests (`.github/workflows/ci.yml`) and backend image build (`.github/workflows/docker.yml`).

## Project layout

- `backend/` FastAPI app, models, schemas, and frontend assets
- `backend/tests/` pytest suite for habits, milestones, and reflections
- `docker-compose.yml` Local orchestration for the backend service
- `requirements.txt` Core dependencies for legacy entrypoints

## Configuration

- `DATABASE_URL` to point at another Postgres/SQLite URL (default is SQLite under `backend/data/`)
- Static assets served from `backend/frontend` at `/ui`

## Contributing

Small, test-backed PRs welcome. Keep the FastAPI surface and schemas consistent with existing tests and API contract.

## License

MIT License. See `LICENSE`.
