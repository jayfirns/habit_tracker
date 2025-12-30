## Strategic Enhancements & Future Interactions (FocusOS Web Application)

The primary goal is to transform this project into "FocusOS," a **local network web server application** adhering to the architectural principles outlined above. This will involve:

### Functional Requirements Alignment
-   **Goal & Habit Model**: Develop robust backend services and database schema to support evolving goals, subgoals, nested structures, and their relationships. Habits will be independent or linked to goals.
-   **Hierarchical Structure**: Implement data models and API endpoints that explicitly maintain and leverage hierarchical relationships for goals and subgoals, ensuring higher-level structures contextualize lower-level execution.
-   **Representation Layer**: Design and implement multiple web-based views (Strategic, Tactical, Operational, Analytical) over the shared domain model, ensuring they are non-destructive and switchable.
-   **Time Tracking & Accountability**:
    *   Integrate embedded time tracking (manual start/stop, post-hoc attribution) linked to habits, subgoals, and goals.
    *   Develop features to surface planned vs. actual effort, drift, and investment signals.
    *   **Crucially, the system must track time boundaries set by the goal creator, providing reminders and completion percentage updates if metrics are available.**
    *   **Implement prompts for users to reflect quarterly and at year-end, covering reflections, lessons learned, and future outlook.**
-   **SMART Goal Enforcement**:
    *   Implement validation logic in the Interaction & Intent layer to enforce measurable outcomes, time boundaries, and clear success definitions for goal creation, preventing ambiguous entries.
    *   **Support setting intentions as part of the SMART goal creation process.**
    *   **Implement a mechanism to display contextual banners or inspirational messages by dates defined in goal creation.**
-   **Privacy & Data Control**: Ensure the system is private by default, with no social sharing or external accountability, and full user control over their data. This will influence authentication/authorization design for a local server.
-   **Focus Preservation**: Design the web application to minimize notifications, avoid gamification, and favor clarity, with reflective rather than punitive feedback.

### Non-Functional Requirements Alignment
-   **Offline-capable core**: Consider how the web application can support offline access or robust local caching for fast interactions and data integrity.
-   **Fast local interactions**: Optimize API endpoints and frontend rendering for quick responses within a local network.
-   **Deterministic data behavior**: Prioritize robust database transactions and clear data flow.
-   **Exportability**: Implement features to export data in Markdown, JSON, and CSV formats.
-   **Strong data integrity guarantees**: Implement robust validation, error handling, and potentially versioning in the Persistence Layer.

### Technical Implementation Details
-   **Backend Framework Selection**: Choose a suitable Python web framework (e.g., Flask, FastAPI, Django) for the Interaction & Intent layer, replacing the Tkinter GUI.
-   **Frontend Development**: Implement a web-based user interface using standard web technologies (HTML, CSS, JavaScript framework like React/Vue/Angular if needed) for the Representation Layer to interact with the new backend.
-   **API Design**: Define clear API endpoints for all functional requirements, reflecting the Domain Model.
-   **Database Abstraction**: Potentially introduce an ORM (e.g., SQLAlchemy) to manage SQLite interactions more robustly, fitting within the Persistence Layer.
-   **Containerization Strategy**: Investigate and implement Docker or similar containerization technologies to ensure consistent and isolated deployment on a Linux host. This will involve creating Dockerfiles and understanding container orchestration concepts for all layers.
-   **Notification System Rework**: The current Tkinter-based notification system will need to be re-evaluated and re-implemented for a web environment (e.g., server-side push notifications, client-side polling, or browser-based notifications).
-   **Testing**: Develop a comprehensive testing strategy for both the backend API and the frontend UI, including unit, integration, and end-to-end tests.
-   **Deployment**: Document clear steps for deploying the "FocusOS" web application on a local Linux network, potentially leveraging Docker Compose for multi-service applications.
-   **Privacy-First LLM Integration for Coaching**:
    *   **Inspirational Messages**: Explore mechanisms for generating inspirational messages/banners.
    *   **Option 1: Limited Context LLM Calls**: If external LLMs are used, ensure they are invoked with minimal, non-sensitive, and anonymized context to maintain user privacy (e.g., only goal type or general progress, *not* goal content).
    *   **Option 2: Embedded Prompt Creator**: Provide an in-app tool for users to craft prompts or provide explicit consent for what information from their goals/habits can be shared with an LLM for personalized coaching/messages.
    *   **Local/On-Device LLM (Future Consideration)**: Investigate the feasibility of integrating a small, local, or on-device LLM for generating these messages without any external data transmission, thus reinforcing privacy.

When interacting with this project, new features and bug fixes should be aligned with the "FocusOS" product vision, prioritizing the development of the web-based, potentially containerized solution over further enhancements to the existing Tkinter desktop client.