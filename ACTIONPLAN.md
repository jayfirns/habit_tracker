# ACTIONPLAN.md - FocusOS Web Migration Game Plan

This document outlines the high-level action plan for migrating the "My Personal Habit Tracker" desktop application to "FocusOS," a local network web server application. This plan adheres to the architectural principles and functional/non-functional requirements detailed in `GEMINI.md`.

**Guiding Principles:**
-   **Test-Driven Development (TDD)**: All new features and significant refactorings will be guided by TDD. Tests will be written *before* implementation to define expected behavior, ensure correctness, and facilitate a robust regression suite.
-   **Iterative Development**: We will proceed in small, manageable iterations, delivering functional components at each stage.
-   **API First**: The backend API will be developed with a clear contract before extensive frontend development.
-   **Privacy by Design**: User data privacy will be a paramount consideration in all design and implementation choices.
-   **Containerization**: The application components will be designed for deployment within Docker containers from the outset.

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
-   [ ] Create initial database migration script(s) for `habits` and `completions` tables, ensuring `note` and `id` are present in `completions`.
-   [ ] Develop Python classes for `Habit` and `Completion` entities, mapped to the ORM.
-   [ ] Implement basic API endpoints:
    -   `GET /habits`
    -   `GET /habits/{id}`
    -   `POST /habits`
    -   `PUT /habits/{id}`
    -   `DELETE /habits/{id}`
    -   `POST /habits/{id}/complete` (with note functionality).
    -   `GET /habits/{id}/completions`
-   [ ] Implement basic validation (e.g., habit name/category not empty) and initial streak calculation logic within API endpoints.
-   [ ] Adapt logging to stdout/stderr for containerization, using appropriate web server configuration.
-   [ ] Create `Dockerfile` for the backend service.
-   [ ] Write unit and integration tests for all API endpoints and data model logic (TDD).

## Phase 2: Web Frontend - Representation Layer

**Objective**: Develop a basic web-based UI that consumes the API from Phase 1 to display and manage habits. This phase focuses on the Representation Layer principles.

**Key Deliverables**:
-   Basic web application project.
-   UI for displaying habit list, adding/editing habits, and marking habits as done.
-   Basic styling.
-   `Dockerfile` for the frontend service.
-   `docker-compose.yml` to orchestrate backend and frontend.

**Tasks**:
-   [ ] Initialize new web frontend project (e.g., simple HTML/CSS/JS or a lightweight JS framework).
-   [ ] Develop UI component to display the list of habits from `GET /habits`.
-   [ ] Create UI forms for `POST /habits` (Add Habit) and `PUT /habits/{id}` (Edit Habit).
-   [ ] Implement UI for `POST /habits/{id}/complete` (Mark as Done), including note input.
-   [ ] Apply basic, responsive styling.
-   [ ] Create `Dockerfile` for the frontend service.
-   [ ] Create or update `docker-compose.yml` to run both backend and frontend services.
-   [ ] Write end-to-end tests for core user flows (TDD).

## Phase 3: Advanced Features & Refinements

**Objective**: Implement the more complex FocusOS functional and non-functional requirements, including hierarchical goals, time tracking, advanced representations, and privacy-first LLM integration. This phase will build out the remaining aspects of the Domain Model, Representation, and Interaction & Intent Layers.

**Key Deliverables**:
-   Extended Domain Model and API for Goals, Subgoals, Relationships, and TimeEntries.
-   Advanced web views (Strategic, Tactical, Operational, Analytical).
-   Robust time tracking and reflection mechanisms.
-   SMART goal enforcement and intention setting.
-   Privacy-first LLM integration for coaching.
-   Comprehensive testing suite.
-   Deployment documentation.

**Tasks**:
-   [ ] **Goals & Hierarchical Structure**:
    -   [ ] Extend Domain Model and database schema for `Goal` entities and `Relationship` entities.
    -   [ ] Develop API endpoints for managing goals, subgoals, and their hierarchical relationships.
    -   [ ] Update frontend to display and manage hierarchical goals.
    -   [ ] Write tests (TDD).
-   [ ] **Enhanced Time Tracking & Accountability**:
    -   [ ] Add `TimeEntry` entity to Domain Model.
    -   [ ] Implement API for manual start/stop and post-hoc attribution of time to habits/goals/subgoals.
    -   [ ] Develop frontend UI for time tracking.
    -   [ ] Implement backend logic to track goal time boundaries, completion percentages, and surface planned vs. actual effort/drift.
    -   [ ] Develop frontend UI for quarterly and EOY reflection prompts.
    -   [ ] Write tests (TDD).
-   [ ] **Advanced Representation Layer (Views)**:
    -   [ ] Implement API endpoints for data aggregations required by Strategic, Tactical, Operational, and Analytical views.
    -   [ ] Integrate web-based charting libraries (e.g., Chart.js, D3.js) and calendar components (e.g., FullCalendar.js) into the frontend.
    -   [ ] Develop dedicated frontend views for each representation.
    -   [ ] Write tests (TDD).
-   [ ] **SMART Goal Enforcement & Intentions**:
    -   [ ] Implement robust validation logic in the backend (Interaction & Intent Layer) for SMART goal criteria.
    -   [ ] Develop frontend UI to guide users through SMART goal creation and intention setting.
    -   [ ] Implement backend and frontend logic for displaying contextual banners/inspirational messages based on goal dates.
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
