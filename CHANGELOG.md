---
created: 2025-12-30T20:19
updated: 2025-12-31T00:02
---
# CHANGELOG.md - FocusOS Project Progress

This document tracks significant changes, features, and fixes implemented throughout the development of the FocusOS web application. It serves as a record of progress, a reference for debugging, and a tool for quality control.

---

## Unreleased - Habit Deletion Refactor and Test Enhancement

### Added
- **Docs**: Updated `README.md` Quickstart for macOS/Linux with Docker Compose.
- **Frontend**: Created `deleteHabitFlow.js` to encapsulate the habit deletion logic, making it more robust and testable.
- **Frontend**: Introduced `milestoneSelection.js` to manage habit selection state for milestones in the UI.
- **Tests**: Added tests for the new `deleteHabitFlow.js` module (`deleteHabitFlow.test.mjs`).
- **Tests**: Expanded tests in `habitState.test.mjs` to handle missing collections and string-keyed habit IDs.
- **Tests**: Added tests to `habitsView.test.mjs` to ensure delete buttons are correctly wired for each habit.
- **Tests**: Added backend API tests (`test_api.py`) to confirm that deleting a habit does not delete associated milestones, blocks completion listing for the deleted habit, and does not affect other habits.
- **Tests**: Introduced tests for `milestoneSelection.js` (`milestoneSelection.test.mjs`) to validate milestone habit selection management.

### Changed
- **Feature**: Implemented comprehensive habit deletion flow with milestone integration.
- **Refactor**: Completed Goal to Milestone refactoring.
- **Checkpointing**: Habit deletion flow enhancements and refactor fixes.
- **Backend**: Enhanced habit deletion in `crud.py` to explicitly clear habit-milestone associations, ensuring data integrity.
- **Frontend**: Refactored `app.js` to use the new `deleteHabitFlow` function, integrating client-side state cleanup for milestone pickers via an `onAfterDelete` callback.
- **Docs**: Updated `ACTIONPLAN.md` with more detailed information on known gaps and test execution, reflecting the resolution of habit deletion issues.

## Unreleased - Time Glide, Focus Tracking, SMART Enhancements

### Added
- **Docs**: Created `LOGIC_RULES.md` to document system-level behavioral rules for deletion and modification of tasks and goals.
- **Feature**: Implemented soft-delete for goals by setting their status to "archived", preserving goal history.
- **Feature**: Enhanced habit deletion to purge all associated local data (time logs, manual logs, and active timers) from the frontend state.

### Changed
- **Docs**: Reorganized documentation files by moving several markdown files from the root directory into the `docs/` and `docs/frontend/` directories to improve repository structure.
- **Tests**: Added tests for goal soft-deletion, modification of completed goals, and frontend state purging after habit deletion.

### Added
- **Docs**: Added `TESTING_MANDATES.md` detailing project-wide testing standards and workflow.
- **Tests**: Added `jsdom`-based unit tests for Energy Mix Panel UI rendering functions; refactored `energyMixPanel.js` for testability.
- **Docs**: Added bidirectional links between `DESIGN_GLOSSARY.md` and `UI_PANELS_DOCUMENTATION.md`.
- **Docs**: Added detailed dependency analysis for `.js-category` to `DESIGN_GLOSSARY.md`.
- **Workday Time Glide**: Gradient bar with planned vs. worked minutes, clock-out, and manual worked override so summaries stay honest to the day.
- **Focused Time**: Habit-level stopwatch with live counter, manual adjustment per habit, and focus parsing from completion notes to keep daily totals accurate.
- **Dashboards**: SMART pulse dashboard, Energy Mix pie chart, and a 5-column daily time summary (planned, worked, % plan, focused, % focused).
- **TDD Utilities**: `time-utils` tests covering focus parsing, time formatting, and workday math.

### Changed
- **Docs**: Updated `TESTING_MANDATES.md` with new insights on UI interaction testing and refactoring safeguards.
- Refactored `energyMixPanel.js` to improve testability, robustness, and empty state handling.
- Time summary and habit cards now consume a single source of truth for focus minutes, including manual overrides and active timers.
- Milestones/SMART UI tightened with linked habits and reflection hooks.
- SMART goal form now sends the backend-compatible payload, surfaces clearer save errors, and the modal footprint is slightly smaller for easier use.

### Fixed
- Fixed non-functional tabs on the Energy Mix Panel by correcting a data attribute mismatch between the HTML and JavaScript.
- Safely removed redundant `.js-category` element from habit cards, fixing a critical rendering failure on the Habit Board.
- Eliminated double-counting of focus minutes across completions, timers, and overrides; ensured manual worked values propagate through all calculations.

## 0.1.2 - 2025-12-30 (Frontend Modularization and Gitignore Updates)

### Added
-   **Frontend Styling Modularization**: Refactored frontend styles by replacing a single `styles.css` with modular `base.css`, `components.css`, and `themes.css`. Updated `app.js` and `index.html` to use these new styles.

### Changed
-   `.gitignore` updated to include `backend/venv/`, `__pycache__/`, `.pytest_cache/`, `*.db`, and `data/` to prevent tracking of virtual environment files, Python cache, database files, and local data directory.

## 0.1.1 - 2025-12-29 (Backend Core Initialization & Alembic Configuration Attempts)

### Added
-   **Backend Project Structure**: Created `backend/` directory with FastAPI application (`main.py`).
-   **Habit API & Validation**: Implemented habits/completions CRUD endpoints with streak calculation and validation schemas.
-   **Testing**: Added unit/integration-style tests for ORM models and API handlers.
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
