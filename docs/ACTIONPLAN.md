---
created: 2025-12-30T20:19
updated: 2025-12-31T10:28
---
# ACTIONPLAN.md - FocusOS Web Migration Game Plan

This document outlines the high-level action plan for migrating the "My Personal Habit Tracker" desktop application to "FocusOS," a local network web server application. This plan adheres to the architectural principles and functional/non-functional requirements detailed in `GEMINI.md`.

**Guiding Principles:**
-   **Test-Driven Development (TDD)**: All new features and significant refactorings will be guided by TDD. Tests will be written *before* implementation to define expected behavior, ensure correctness, and facilitate a robust regression suite.
-   **Iterative Development**: We will proceed in small, manageable iterations, delivering functional components at each stage.
-   **API First**: The backend API will be developed with a clear contract before extensive frontend development.
-   **Privacy by Design**: User data privacy will be a paramount consideration in all design and implementation choices.
-   **Containerization**: The application components will be designed for deployment within Docker containers from the outset.
-   **Continuous Improvement**: Project setup, dependencies, and configurations will be continuously refined for maintainability, security, and developer experience.

---

## HABIT_ARCHITECTURE Review Gameplan (Testing-Mandated)

**Objective**: Review `docs/HABIT_ARCHITECTURE.md` for alignment with current implementation, terminology usage, and future roadmap, while scoping required tests per `docs/TESTING_MANDATES.md`.

**Steps**:
-   **Baseline scan**: Summarize the current entity hierarchy (Habit, Completion, Milestone/Target, Reflection) and note deprecated terms (Goal, Task/To-Do).
-   **Implementation alignment check**: Compare the architecture terms against actual code usage in `backend/models.py`, `backend/schemas.py`, and API routes; log mismatches or terminology drift.
-   **Schema consistency review**: Verify any referenced optional fields (e.g., `target_count`, `metrics`, `scope`) against the current schema; flag missing fields as either TODOs or doc updates.
-   **UI labeling audit**: Confirm the frontend/UI does not expose legacy terms (`goal`) or imply unimplemented entities (`task`, `todo`, `action`).
-   **Test plan mapping (per TESTING_MANDATES)**:
    -   Define UI logic tests for any label/term shifts or new UX toggles.
    -   Add state management tests for new/updated fields and their propagation to views.
    -   Cover edge/empty states (missing optional fields, empty completions).
    -   Validate any globally exposed helpers if introduced (existence + repeatable behavior).
-   **Deliverables**: A short discrepancy list, doc updates (if needed), and a TDD checklist for any new implementation work.

**Initial Review Notes (Alignment Gaps)**:
-   **Goal → Milestone rename**: Goal terminology has been replaced by Milestone across backend, API, tests, and UI to match architecture.
-   **Reflection linking**: Reflection now links via `milestone_id` to align with Milestone as the target entity.
-   **Task label in UI**: Time summary “Task” label updated to “Habit” to avoid implying a Task entity.
-   **Habit optional fields**: `category`/`tags` exist; `target_count`, `metrics`, `scope` are not present in the schema yet.

**TDD Follow-Ups (If Changes Proceed)**:
-   **UI logic**: Tests for milestone insights and prompt copy added; extend if overlay flow changes are introduced.
-   **State management**: Ensure milestone field changes propagate to dashboard counts, reflection linking, and habit coverage.
-   **Edge/empty states**: Verify “no milestones/habits” and missing optional fields still render sane fallbacks.
-   **Global exposure**: If any new helpers are added for renaming/formatting, test existence and repeated calls.

---

## Task Deletion Behavior Review (Testing-Mandated)

**Objective**: Ensure task deletion is supported as a first-class workflow and aligned with `docs/LOGIC_RULES.md` plus `docs/TESTING_MANDATES.md`.

**Steps**:
-   **Rules alignment**: Confirm the delete flow permanently removes the Task, all completion records, and any in-memory state (timers/logs).
-   **UX audit**: Review delete affordances and destructive styling (see `docs/DESIGN_GLOSSARY.md` DeleteButton note) for clarity and intent.
-   **API + data checks**: Verify API and persistence behavior guarantee no orphaned completion records.
-   **Test plan (per TESTING_MANDATES)**:
    -   UI logic: delete action wiring, confirm prompt, and list refresh behavior.
    -   State management: removal from UI state + timers/logs purge.
    -   Edge/empty states: deleting last habit, deleting with no completions, deleting with active timer.
    -   Integration: ensure persistence and local state stay in sync after deletion.
-   **Deliverables**: Gap list, required test cases, and any doc updates needed.
-   **Known gaps to resolve**:
    -   Habit deletion does not explicitly clear join rows in `habit_milestones` (see `backend/models.py` and `backend/crud.py`); validate DB-level cascade or add explicit cleanup.
    -   Habit deletion does not update `state.milestoneHabitSelection`, which can leave deleted habit IDs in the milestone picker state (see `backend/frontend/app.js`).
-   **Repeatable test runs**:
    -   `python -m pytest`
    -   `node --test backend/frontend/**/*.test.mjs`
    -   **Expected results (current tests passing)**:
        -   Deleting a habit removes it from listings and deletes completions in persistence (`backend/tests/test_api.py`).
        -   Deleting a habit does not delete associated milestones (`backend/tests/test_api.py`).
        -   Deleting a habit blocks completion listing for that habit (`backend/tests/test_api.py`).
        -   UI delete wiring calls the delete handler per habit (`backend/frontend/ui/habitsView.test.mjs`).
        -   Delete flow confirms, updates status, purges local logs/timers, and refreshes (`backend/frontend/ui/deleteHabitFlow.test.mjs`).
        -   Delete confirmation message warns it cannot be undone (`backend/frontend/ui/deleteHabitFlow.test.mjs`).

---

## Phase 1: Backend Core - Domain Model & Persistence Layer (API First)

**Objective**: Establish the core data model and persistence mechanism, exposed via a basic API. This phase prioritizes getting the "one source of truth" operational and accessible, following the Domain Model Layer and Persistence Layer principles from `GEMINI.md`.

**Key Deliverables**:
-   New Python web project structure.
-   ORM-managed database schema for `Habit` and `Completion` entities.
-   RESTful API endpoints for basic CRUD operations on Habits and Completions.
-   Basic logging and configuration for the web application.
-   Initial `Dockerfile` for the backend service.

**Tasks**:
-   [x] Initialize new Python web project (e.g., FastAPI/Flask).
-   [x] Define dependencies in `pyproject.toml` or `requirements.txt`.
-   [x] Implement ORM (e.g., SQLAlchemy) and configure database connection (SQLite initially).
-   [ ] Create initial database migration script(s) for `habits` and `completions` tables, ensuring `note` and `id` are present in `completions`. (SKIPPED/DEFERRED due to persistent Alembic import issues; will revisit or re-evaluate migration strategy later.)
-   [x] Develop Python classes for `Habit` and `Completion` entities, mapped to the ORM.
-   [x] Implement basic API endpoints:
    -   `GET /habits`
    -   `GET /habits/{id}`
    -   `POST /habits`
    -   `PUT /habits/{id}`
    -   `DELETE /habits/{id}`
    -   `POST /habits/{id}/complete` (with note functionality).
    -   `GET /habits/{id}/completions`
-   [x] Implement basic validation (e.g., habit name/category not empty) and initial streak calculation logic within API endpoints.
-   [x] Adapt logging to stdout/stderr for containerization, using appropriate web server configuration.
-   [x] Create `Dockerfile` for the backend service.
-   [x] Write unit and integration tests for all API endpoints and data model logic (TDD).

## Phase 2: Web Frontend - Representation Layer

**Objective**: Develop a basic web-based UI that consumes the API from Phase 1 to display and manage habits. This phase focuses on the Representation Layer principles.

**Key Deliverables**:
-   Basic web application project.
-   UI for displaying habit list, adding/editing habits, and marking habits as done.
-   Basic styling.
-   `Dockerfile` for the frontend service.
-   `docker-compose.yml` to orchestrate backend and frontend.

**Tasks**:
-   [x] Initialize new web frontend project (simple HTML/CSS/JS served by backend).
-   [x] Develop UI component to display the list of habits from `GET /habits`.
-   [x] Create UI forms for `POST /habits` (Add Habit) and `PUT /habits/{id}` (Edit Habit). (Edit deferred; Add shipped.)
-   [x] Implement UI for `POST /habits/{id}/complete` (Mark as Done), including note input.
-   [x] Apply basic, responsive styling (now modularized with `base.css`, `components.css`, `themes.css`).
-   [x] Create `Dockerfile` for the frontend service. (Frontend served from backend image; no separate build needed.)
-   [x] Create or update `docker-compose.yml` to run both backend and frontend services.
-   [ ] Write end-to-end tests for core user flows (TDD).

## Phase 3: Advanced Features & Refinements

**Objective**: Implement the more complex FocusOS functional and non-functional requirements, including hierarchical milestones, time tracking, advanced representations, and privacy-first LLM integration. This phase will build out the remaining aspects of the Domain Model, Representation, and Interaction & Intent Layers.

**Key Deliverables**:
-   Extended Domain Model and API for Milestones, Submilestones, Relationships, and TimeEntries.
-   Advanced web views (Strategic, Tactical, Operational, Analytical).
-   Robust time tracking and reflection mechanisms.
-   SMART milestone enforcement and intention setting.
-   Privacy-first LLM integration for coaching.
-   Comprehensive testing suite.
-   Deployment documentation.

**Tasks**:
-   [ ] **Milestones & Hierarchical Structure**:
-   [ ] Extend Domain Model and database schema for `Milestone` entities and `Relationship` entities.
-   [ ] Develop API endpoints for managing milestones, submilestones, and their hierarchical relationships.
-   [ ] Update frontend to display and manage hierarchical milestones.
    -   [ ] Write tests (TDD).
-   [ ] **Enhanced Time Tracking & Accountability**:
    -   [ ] Add `TimeEntry` entity to Domain Model.
    -   [x] Implement manual start/stop and post-hoc attribution of time to habits (front-end timers + overrides).
    -   [x] Develop frontend UI for workday glide bar, focus summaries, and manual overrides.
    -   [x] Refactor Workday Time Glide panel into planned vs actual clocked modes with TDD coverage (state locking, overrides, empty state).
    -   [x] Persist Workday Time Glide state via backend `/workday` API for cross-device sync, with local fallback.
    -   [x] Add backend + frontend tests validating workday persistence and UI state locking.
-   [ ] Implement backend logic to track milestone time boundaries, completion percentages, and surface planned vs. actual effort/drift.
    -   [ ] Develop frontend UI for quarterly and EOY reflection prompts.
    -   [ ] Write tests (TDD).
-   [ ] **Advanced Representation Layer (Views)**:
    -   [ ] Implement API endpoints for data aggregations required by Strategic, Tactical, Operational, and Analytical views.
    -   [ ] Integrate web-based charting libraries (e.g., Chart.js, D3.js) and calendar components (e.g., FullCalendar.js) into the frontend.
    -   [ ] Develop dedicated frontend views for each representation.
    -   [ ] Write tests (TDD).
-   [ ] **SMART Milestone Enforcement & Intentions**:
-   [ ] Implement robust validation logic in the backend (Interaction & Intent Layer) for SMART milestone criteria.
-   [x] Develop frontend UI to guide users through SMART milestone creation and intention setting, with linked habits.
-   [ ] Implement backend and frontend logic for displaying contextual banners/inspirational messages based on milestone dates.
    -   [ ] Write tests (TDD).
-   [ ] **Privacy-First LLM Integration for Coaching**:
    -   [ ] Research options for small/local/on-device LLMs or limited-context external LLM integration.
    -   [ ] Develop backend service for LLM interaction (if external, ensure strict privacy controls).
    -   [ ] Implement frontend UI for user-crafted prompts or explicit consent for LLM interaction.
    -   [ ] Integrate LLM-generated inspirational messages/coaching into the frontend.
    -   [ ] Write tests (TDD).
-   [ ] **Export & Interop Layer**:
    -   [ ] Implement API endpoints for exporting data (Markdown, JSON, CSV).
    -   [ ] Develop frontend UI for data export functionality.
    -   [ ] Write tests (TDD).
-   [ ] **Notification System**:
    -   [ ] Re-evaluate and implement web-appropriate notifications (e.g., WebSockets, push notifications).
    -   [ ] Write tests (TDD).
-   [ ] **Non-Functional Refinements**:
    -   [ ] Investigate and implement strategies for offline capability (PWA, local caching).
    -   [ ] Performance testing and optimization for fast local interactions.
    -   [ ] Enhanced data integrity measures and deterministic behavior.
-   [ ] **Comprehensive Testing**: Continuously expand unit, integration, and end-to-end testing throughout the phase.
-   [ ] **Deployment Documentation**: Create comprehensive documentation for deploying FocusOS with Docker Compose on a Linux host.
-   [ ] **Documentation**:
    -   [ ] Review `docs/panels/EnergyMixPanel.md` to ensure it reflects current duration display behavior (blank center label, aria-label).
    -   [ ] Create `CONTRIBUTING.md` to document the development workflow (feature branch -> commit -> push -> PR to `dev` -> PR to `main`), including `gh` CLI usage.
-   [ ] **UI/Component Refinements**:
    -   [ ] Standardize Time Formatting Across All Panels: Time durations (e.g., "2h 42m") are currently handled inconsistently across various panels. We need to define and enforce a single global formatting method to avoid duplication and inconsistency (e.g., "2h 42m minutes"). This includes removing redundant suffixes like "minutes" when already included in formatted strings, implementing a global time formatter utility (e.g., `formatDuration()`) to be reused in all badge and label components, updating all components that display time durations — such as EnergyPanel, HabitLogCard, SummaryViews, and any pop-up badges — to use this formatter, and ensuring accessibility via consistent `aria-label` support, e.g., `aria-label="2 hours 42 minutes"`.
