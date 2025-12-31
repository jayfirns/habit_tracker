---
created: 2025-12-30T20:19
updated: 2025-12-31T00:19
---
# FocusOS Web Application - Strategic Overview & Development Guide

This document outlines the vision, architectural principles, development guidelines, and current status for "FocusOS," a local network web server application. It serves as the primary reference for all interactions and development efforts.

## My Role

As your pair programmer, my responsibilities include:
- Reviewing code for quality, adherence to standards, and alignment with architectural principles.
- Maintaining and updating documentation (including this `GEMINI.md` and the `docs/` directory).
- Providing feedback on design, implementation, and testing strategies.
- Assisting in the implementation of new features and bug fixes, always adhering to TDD.

---

## Guiding Principles

-   **Test-Driven Development (TDD)**: All new features and significant refactorings will be guided by TDD. Tests will be written *before* implementation to define expected behavior, ensure correctness, and facilitate a robust regression suite.
-   **Iterative Development**: We will proceed in small, manageable iterations, delivering functional components at each stage.
-   **API First**: The backend API will be developed with a clear contract before extensive frontend development.
-   **Privacy by Design**: User data privacy will be a paramount consideration in all design and implementation choices.
-   **Containerization**: The application components will be designed for deployment within Docker containers from the outset.
-   **Continuous Improvement**: Project setup, dependencies, and configurations will be continuously refined for maintainability, security, and developer experience.

---

## Terminology Philosophy & Hierarchy (from `docs/HABIT_ARCHITECTURE.md`)

> **Everything begins and ends with the habit.**

The system does **not** treat legacy goals as primary entities. Rather, **habits are the atomic unit of transformation**, and all supporting concepts exist to help structure, measure, or encourage them. Milestones replace the legacy Goal concept and serve as structured targets tied to habits.

### Concept Hierarchy (Top Down)

1.  **Intention (Not Persisted)**: User's intent, informs Habit creation with metadata. Not a persisted object.
2.  **Habit (Core Entity)**: Repeatable behavior, tracked via completions and streaks.
    -   Optional fields (TBD): `target_count`, `scope`, `metrics`, `category`, `tags`.
3.  **Milestone / Target (Supporting Entity)**: Declarative **target** associated with a Habit. Includes due dates, outcome criteria, numeric thresholds.
4.  **Completion (Event Record)**: Dated record of a habit being performed (timestamp, optional note). Drives streaks, analytics, reflection.
5.  **Reflection (Analysis Record)**: Optional record attached to a Habit (or Milestone) for retrospective insight.

### Retired Terms

-   ❌ **Goal**: Replaced by Milestones.

### Planned Feature

-   **Task / To-Do**: Not currently implemented or persisted. Reserves semantic space for future lightweight, ephemeral checklist items.

### Naming Guidelines

| Term                   | Use in Code       | Notes                                   |
| :--------------------- | :---------------- | :-------------------------------------- |
| `habit`                  | ✅ core entity      | Central object; everything builds on this |
| `completion`             | ✅ core entity      | Tied to habit_id; stores date, note     |
| `milestone`, `target`    | ✅ supporting entities | Milestone is implemented                |
| `goal`                   | ❌ legacy         | Do not use                              |
| `task`, `todo`, `action` | 🕓 not implemented | Do not imply existence via UI/labels    |

---

## Logic Rules (from `docs/LOGIC_RULES.md`)

### Milestone States

A Milestone **must** exist in one of the following states: `active`, `complete`, `archived`.
- `active`: In progress.
- `complete`: Successfully finished.
- `archived`: Deleted by user, preserved but not in standard views.

### Task States

A Task (Habit) has no explicit state; its history of completion records determines streak/analytics.

### Deletion Rules

-   **On Milestone Deletion**: State transitions to `archived`. Associated data and links to Tasks are preserved. No deletion of associated Tasks.
-   **On Task Deletion**: Permanently removed from system. All associated completion records permanently removed. In-memory state purged.

### Modification of Completed Milestones

-   `complete` Milestones remain modifiable. Status can be reverted to `active`.

---

## Testing Mandates (from `docs/TESTING_MANDATES.md`)

Testing is paramount and defines behavior.

### Mandatory Coverage Requirements

Every new feature, refactor, or bug fix must have tests for (if applicable):
- **UI Logic**: Tab toggles, view switches, user-driven DOM changes, conditional rendering, responsive behaviors.
- **State Management**: Mutations reflected in UI, re-rendering, defaults/resets.
- **Edge & Empty States**: Null inputs, empty arrays, malformed objects, blank panels.
- **Global Exposure**: Testable existence, expected behavior under known inputs, repeatable calls.
- **Integration Boundaries**: Simulate user actions, assert effects.

### Test Authoring Standards

- **Naming**: `test_toggle_chart_mode_updates_DOM` (clear, descriptive).
- **Structure**: `// 1. Setup`, `// 2. Act`, `// 3. Assert`. Nested `describe()` for grouped behavior.
- **Isolation**: Avoid cross-test dependencies; use `beforeEach()`/`afterEach()`.
- **Clarity**: Explicit selectors, minimal mocking, comments for non-self-evident behavior.

### TDD Enforcement Workflow

1.  Write a failing test.
2.  Implement minimal code to pass.
3.  Refactor while tests are green.
4.  Repeat for additional behavior.
5.  Commit code + tests atomically.
💡 *If the test doesn’t fail without your code, it doesn’t count.*

---

## Project Status & Action Plan (from `docs/ACTIONPLAN.md`)

### Phase 1: Backend Core - Domain Model & Persistence Layer (API First) - **COMPLETED**

-   New Python web project (FastAPI) initialized.
-   Dependencies defined (`pyproject.toml`).
-   ORM (SQLAlchemy) configured (SQLite initially).
-   Python classes for `Habit` and `Completion` entities, mapped to ORM.
-   Basic API endpoints for `Habits` and `Completions` (CRUD, complete with note, get completions).
-   Basic validation and initial streak calculation logic implemented.
-   Logging adapted for containerization.
-   `Dockerfile` for backend service created.
-   Unit and integration tests for API endpoints and data model logic.
-   *(Deferred: Initial database migration script(s) for `habits` and `completions` tables)*

### Phase 2: Web Frontend - Representation Layer - **COMPLETED**

-   New web frontend project (simple HTML/CSS/JS served by backend) initialized.
-   UI component for displaying habit list from `GET /habits`.
-   UI forms for `POST /habits` (Add Habit). (Edit deferred; Add shipped.)
-   UI for `POST /habits/{id}/complete` (Mark as Done), including note input.
-   Basic, responsive styling applied.
-   `Dockerfile` for frontend service (served from backend image).
-   `docker-compose.yml` to run backend and frontend services.
-   *(TODO: End-to-end tests for core user flows)*

### Phase 3: Advanced Features & Refinements - **CURRENT FOCUS**

**Objective**: Implement the more complex FocusOS functional and non-functional requirements, including hierarchical milestones, time tracking, advanced representations, and privacy-first LLM integration.

**Key Deliverables**:
-   Extended Domain Model and API for Milestones, Submilestones, Relationships, and TimeEntries.
-   Advanced web views (Strategic, Tactical, Operational, Analytical).
-   Robust time tracking and reflection mechanisms.
-   SMART milestone enforcement and intention setting.
-   Privacy-first LLM integration for coaching.
-   Comprehensive testing suite.
-   Deployment documentation.

**Tasks**:

-   **Milestones & Hierarchical Structure**:
    -   [ ] Extend Domain Model and database schema for `Milestone` entities and `Relationship` entities.
    -   [ ] Develop API endpoints for managing milestones, submilestones, and their hierarchical relationships.
    -   [ ] Update frontend to display and manage hierarchical milestones.
    -   [ ] Write tests (TDD).
-   **Enhanced Time Tracking & Accountability**:
    -   [ ] Add `TimeEntry` entity to Domain Model.
    -   [x] Implement manual start/stop and post-hoc attribution of time to habits (front-end timers + overrides).
    -   [x] Develop frontend UI for workday glide bar, focus summaries, and manual overrides.
    -   [ ] Implement backend logic to track milestone time boundaries, completion percentages, and surface planned vs. actual effort/drift.
    -   [ ] Develop frontend UI for quarterly and EOY reflection prompts.
    -   [ ] Write tests (TDD).
-   **Advanced Representation Layer (Views)**:
    -   [ ] Implement API endpoints for data aggregations required by Strategic, Tactical, Operational, and Analytical views.
    -   [ ] Integrate web-based charting libraries (e.g., Chart.js, D3.js) and calendar components (e.g., FullCalendar.js) into the frontend.
    -   [ ] Develop dedicated frontend views for each representation.
    -   [ ] Write tests (TDD).
-   **SMART Milestone Enforcement & Intentions**:
    -   [ ] Implement robust validation logic in the backend (Interaction & Intent Layer) for SMART milestone criteria.
    -   [x] Develop frontend UI to guide users through SMART milestone creation and intention setting, with linked habits.
    -   [ ] Implement backend and frontend logic for displaying contextual banners/inspirational messages based on milestone dates.
    -   [ ] Write tests (TDD).
-   **Privacy-First LLM Integration for Coaching**:
    -   [ ] Research options for small/local/on-device LLMs or limited-context external LLM integration.
    -   [ ] Develop backend service for LLM interaction (if external, ensure strict privacy controls).
    -   [ ] Implement frontend UI for user-crafted prompts or explicit consent for LLM interaction.
    -   [ ] Integrate LLM-generated inspirational messages/coaching into the frontend.
    -   [ ] Write tests (TDD).
-   **Export & Interop Layer**:
    -   [ ] Implement API endpoints for exporting data (Markdown, JSON, CSV).
    -   [ ] Develop frontend UI for data export functionality.
    -   [ ] Write tests (TDD).
-   **Notification System**:
    -   [ ] Re-evaluate and implement web-appropriate notifications (e.g., WebSockets, push notifications).
    -   [ ] Write tests (TDD).
-   **Non-Functional Refinements**:
    -   [ ] Investigate and implement strategies for offline capability (PWA, local caching).
    -   [ ] Performance testing and optimization for fast local interactions.
    -   [ ] Enhanced data integrity measures and deterministic behavior.
-   **Comprehensive Testing**: Continuously expand unit, integration, and end-to-end testing throughout the phase.
-   **Deployment Documentation**: Create comprehensive documentation for deploying FocusOS with Docker Compose on a Linux host.
-   **Documentation**:
    -   [ ] Review `docs/panels/EnergyMixPanel.md` to ensure it reflects current duration display behavior (blank center label, aria-label).
    -   [ ] Create `CONTRIBUTING.md` to document the development workflow (feature branch -> commit -> push -> PR to `dev` -> PR to `main`), including `gh` CLI usage.
-   **UI/Component Refinements**:
    -   [ ] Standardize Time Formatting Across All Panels: Define and enforce a single global formatting method for time durations (e.g., "2h 42m") across all panels, including implementing a global time formatter utility and updating all relevant components.

---

## Frontend Guide (from `docs/frontend/FRONTEND_GUIDE.md`)

### Layering
- Pure helpers: `time-utils.js`, `date-utils.js`, `storage.js`.
- Services: `api.js` (fetch wrapper).
- UI modules: `ui/habitsView.js`, `ui/dashboardView.js`.
- Orchestrator: `app.js` wires state, services, and UI callbacks.

### Local Tooling
- `npm install` in `backend/frontend/`.
- `npm run lint` for ESLint.
- `npm run format` / `npm run format:write` for Prettier.

### Coding Notes
- Keep DOM-only code in `ui/`, data shaping in helpers/services.
- Prefer passing callbacks/state into renderers.
- Avoid non-ASCII.

---

## UI Design Glossary & Panel Documentation (from `docs/DESIGN_GLOSSARY.md` and `docs/UI_PANELS_DOCUMENTATION.md`)

These documents provide detailed specifications for UI elements, styling, and individual panel design objectives. Refer to them for specific guidance on visual and interactive components.

### Example: Energy Mix Panel (from `docs/panels/EnergyMixPanel.md`)

-   **Purpose**: Dashboard panel visualizing habit completion distribution by category, total completions, and legend details. Helps identify time allocation imbalances.
-   **Objectives**: Visualize time allocation by category (pie chart), switch chart modes (pie, bars, grouped), show habit-level time logs, grouped bar views, toggle count vs duration, hover tooltips, responsive layout.
-   **Development Notes**: Backed by tests in `backend/frontend/ui/energyMixPanel.test.mjs` and `energyMixPanel.dom.test.mjs`. Tabs and toggles are client-side only. Uses mock data when no habits exist.

---

## Authoritative Files

-   Logic: `LOGIC_RULES.md`
-   Schema: `backend/models.py`, `backend/schemas.py`
-   Frontend: `backend/frontend/app.js`, `ui/*`
-   Tests: `backend/tests/*`, `habit_tracker.py`
-   UI Design: `docs/DESIGN_GLOSSARY.md`, `docs/UI_PANELS_DOCUMENTATION.md`

---

## Last Reviewed

-   2025-12-31