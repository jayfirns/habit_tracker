---
created: 2025-12-30T20:19
updated: 2025-12-31T11:26
---
# CHANGELOG.md - FocusOS Project Progress

This document tracks significant changes, features, and fixes implemented throughout the development of the FocusOS web application. It serves as a record of progress, a reference for debugging, and a tool for quality control.

---

## Unreleased - Documentation Updates and Project Structure

### Added
- **Docs**: Comprehensive `GEMINI.md` update with Strategic Overview & Development Guide, including Guiding Principles, Terminology, Logic Rules, Testing Mandates, Project Status, Frontend Guide, UI Design Glossary, and Authoritative Files.
- **Docs**: New `docs/panels/WorkdayTimeGlidePanel.md` documenting the Workday Time Glide Panel.
- **Project Structure**: New `utils/` directory for utility scripts.
- **Utils**: Added `utils/rsync_target_mac.sh` for pulling database from remote and `utils/rsync_target_trigkey.sh` for pushing database to remote.

### Changed
- **Docs**: `docs/panels/EnergyMixPanel.md` updated with `created`, `updated` metadata and `Debug Notes`.
- **Docs**: `docs/UI_PANELS_DOCUMENTATION.md` updated with `created`, `updated` metadata and documentation for `WorkdayTimeGlidePanel`.
- **Docs**: `docs/HABIT_ARCHITECTURE.md` updated with `created` and `updated` metadata.

### Fixed
- **Docs**: Removed stray character in `docs/HABIT_ARCHITECTURE.md`.

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

-   **Backend**: Introduced `WorkdayState` SQLAlchemy model to persist workday planning and clocking details.

-   **Backend**: Added CRUD operations for `WorkdayState` in `crud.py`.

-   **Backend**: Implemented FastAPI endpoints (`/workday` GET/PUT) for managing workday state.

-   **Backend**: Introduced `workday_date` field to `WorkdayState` model and schemas to track daily state.

-   **Frontend**: Implemented API client methods (`getWorkdayState`, `saveWorkdayState`) for interacting with the backend workday state.

-   **Frontend**: Refactored `loadWorkdayConfig` and `saveWorkdayConfig` to sync workday state with the backend, with local storage fallback.

-   **Frontend**: Added `hasWorkdayData` and `serializeWorkdayForApi` utility functions.

-   **Frontend**: Added "Reset day" button and logic to clear clock-in/out and worked minutes, allowing a fresh start for the day.

-   **Tests**: Expanded `workday-panel.test.mjs` to mock `/workday` API calls, enabling comprehensive testing of frontend workday state logic.

-   **Tests**: Added new API tests (`test_get_workday_state_creates_default`, `test_update_workday_state_persists`) for the `WorkdayState` endpoints.

-   **Schema**: Defined `WorkdayState` Pydantic schemas (`WorkdayStateBase`, `WorkdayStateUpdate`, `WorkdayStateRead`) for API validation.

-   **Docs**: Updated `LOGIC_RULES.md` with "Workday Time Glide Rules" section, detailing backend persistence, modes, clocking, UI locking, and progress calculation.

-   **Docs**: Updated `LOGIC_RULES.md` and `WorkdayTimeGlidePanel.md` with rules and behavior for `workday_date` and reset functionality.

-   **Docs**: Updated `panels/WorkdayTimeGlidePanel.md` to reflect backend persistence, local storage fallback, server payload structure, and refined development/debug notes.

-   **Docs**: Updated `HABIT_ARCHITECTURE.md` to include "Workday State" as a "Supporting System Entity" in its Concept Hierarchy and Naming Guidelines.

-   **Migration**: Added `backend/migrate_workday_state.py` to add `workday_date` column to existing databases.

### Energy Mix Duration Calculation

-   **Feature**: Energy Mix duration view now includes minutes parsed from completion notes (e.g., "20m focus") when dedicated time logs are absent for a given day.
-   **Refactor**: The duration view in the Energy Mix panel now exclusively shows habits with logged time, presenting an empty state if no durations are recorded, rather than falling back to a frequency view.
-   **Tests**: Added comprehensive unit tests for the updated duration aggregation logic, covering time logs, active timers, and note parsing.
-   **Docs**: Updated `LOGIC_RULES.md`, `TESTING_MANDATES.md`, and `panels/EnergyMixPanel.md` to document the new authoritative time tracking rules, the current client-side implementation gap, and the intended behavior of the duration view.

### Backend Persistence for Time Logs

-   **Feature**: Migrated habit time tracking from client-side local storage to the backend database.
-   **Backend**: Introduced `HabitTimeLog` model and corresponding API endpoints (`/time-logs`, `/time-logs/totals`, `/habits/{id}/time-logs`) to create, list, and aggregate persisted time logs.
-   **Frontend**: Refactored `app.js` and `api.js` to use the new backend endpoints, making the database the single source of truth for habit durations.
-   **Refactor**: Removed client-side logic for manual log handling and time aggregation from completion notes, simplifying the frontend and centralizing business logic in the backend.
-   **Tests**: Added backend API tests for the new time log endpoints.
-   **Docs**: Updated `panels/EnergyMixPanel.md` to reflect the new backend-driven persistence for time logs.





### Fixed

-   **Frontend**: Corrected progress bar calculation in `updateWorkdayProgress` to accurately reflect worked minutes against planned minutes.

### Fixed

-   **Frontend**: Corrected progress bar calculation in `updateWorkdayProgress` within `app.js` to accurately reflect worked minutes against planned minutes, handling zero/null planned minutes.

-   **Frontend**: `backend/frontend/ui/dashboardView.js` updated to consume the new `computeWorkdayMinutes` output and dynamically render workday metrics.

-   **Docs**: `docs/ACTIONPLAN.md`, `docs/UI_PANELS_DOCUMENTATION.md`, and `docs/panels/WorkdayTimeGlidePanel.md` updated to reflect the new "planned vs. clocked" workday model, UI changes, and state management approach.



### Changed

-   **Backend**: Modified `crud.py` to handle `workday_date` during state creation and updates.

-   **Frontend**: `app.js`, `workday-panel.test.mjs`, and `workday-state.js` updated to integrate `workday_date` and "Reset day" functionality.

-   **Tests**: Updated `test_api.py` and `workday-panel.test.mjs` to include tests for `workday_date` and reset actions.

-   **Docs**: Reorganized documentation files by moving several markdown files from the root directory into the `docs/` and `docs/frontend/` directories to improve repository structure.
### Fixed
- **Frontend**: Corrected progress bar calculation in `updateWorkdayProgress` within `app.js` to accurately reflect worked minutes against planned minutes, handling zero/null planned minutes.
- **Frontend**: `backend/frontend/ui/dashboardView.js` updated to consume the new `computeWorkdayMinutes` output and dynamically render workday metrics.
- **Docs**: `docs/ACTIONPLAN.md`, `docs/UI_PANELS_DOCUMENTATION.md`, and `docs/panels/WorkdayTimeGlidePanel.md` updated to reflect the new "planned vs. clocked" workday model, UI changes, and state management approach.

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
- **Docs**: Updated `ACTIONPLAN.md` tasks for "Enhanced Time Tracking & Accountability" to mark Workday State persistence and testing as complete.
- **Docs**: Updated `UI_PANELS_DOCUMENTATION.md` for 'TimeGlidePanel' to reflect new backend persistence via the '/workday' API.

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
