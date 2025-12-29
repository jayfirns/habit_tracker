# CHANGELOG.md - FocusOS Project Progress

This document tracks significant changes, features, and fixes implemented throughout the development of the FocusOS web application. It serves as a record of progress, a reference for debugging, and a tool for quality control.

---

## 0.1.1 - 2025-12-29 (Backend Core Initialization & Alembic Configuration Attempts)

### Added
-   **Backend Project Structure**: Created `backend/` directory with FastAPI application (`main.py`).
-   **Virtual Environment**: Initialized `backend/venv` for project dependencies.
-   **Dependencies**: Added `fastapi`, `uvicorn`, `sqlalchemy`, `alembic` to `backend/pyproject.toml`.
-   **Database Setup**: Configured `backend/database.py` for SQLite connection and `backend/models.py` for SQLAlchemy ORM `Habit` and `Completion` models.
-   **Initial DB Creation**: Successfully created `habit_tracker.db` with `habits` and `completions` tables.
-   **Alembic Initialization**: Ran `alembic init alembic` within `backend/`, creating necessary Alembic configuration files.
-   **Git Ignore**: Added `backend/venv` to `.gitignore`.

### Changed
-   `backend/alembic.ini` updated to use `sqlite:///./habit_tracker.db`.
-   `backend/alembic/env.py` has undergone multiple revisions to attempt to resolve module import issues.
-   `backend/models.py` temporarily modified to use absolute import (`from backend.database import Base`) to facilitate Alembic attempts, now reverted to relative.

### Removed
-   Temporary `backend/create_db.py` script after initial database creation.

### Fixed
-   Corrected the Python executable to `python3` in shell commands.

### Known Issues / Next Steps
-   **Alembic Module Import**: Persistent `ModuleNotFoundError: No module named 'backend'` when running `alembic revision --autogenerate`. Due to this recurring issue and to avoid further loops, **Alembic migration script generation has been deferred.** A simpler migration strategy will be re-evaluated later.
-   **TDD Implementation**: No specific tests have been written yet, a deviation from our TDD principle. Future work will prioritize writing tests *before* implementing features.

---

## 0.1.0 - YYYY-MM-DD (Initial Web Migration Kick-off)

### Added
-   **Project Initialization**: Established new Git branch `feature/focusos-web-migration`.
-   **Documentation**: Created `GEMINI.md` to capture initial project overview, and later updated with the "FocusOS" product vision, architectural philosophy, core layers, and detailed strategic enhancements.
-   **Planning**: Created `ACTIONPLAN.md` outlining the phased implementation game plan for FocusOS web migration, emphasizing TDD.

### Changed
-   The project scope has significantly shifted from a local desktop Tkinter application ("My Personal Habit Tracker") to a local network web server application ("FocusOS") with consideration for containerization.

### Removed
-   (No components removed in this initial phase, as the desktop app still serves as the baseline.)

### Fixed
-   N/A

### Known Issues / Next Steps
-   Begin Phase 1 of the `ACTIONPLAN.md`: Backend Core - Domain Model & Persistence Layer (API First).
-   Focus on setting up the new Python web project, ORM, and initial database schema/migrations.