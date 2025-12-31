---
created: 2025-12-30T20:19
updated: 2025-12-31T00:51
---
# FocusOS - Your Personal Habit & Focus System

FocusOS is a **local-first web application** designed to help you track habits, set milestones, and reflect on your progress without relying on external cloud services. It's built for personal use, privacy, and deep work.

## ✨ Key Features

-   **Habit Tracking**: Easily manage your daily habits, see your completion history, and track streaks.
-   **Milestone & Reflection**: Link your habits to larger goals (milestones) and capture your thoughts and insights along the way.
-   **Simple Web Interface**: Access and manage everything through a clean, intuitive web browser interface.
-   **Local Data Storage**: All your data is stored securely on your own machine in a SQLite database, ensuring complete privacy.

## 🚀 Getting Started (For Everyone)

FocusOS uses [Docker](https://www.docker.com/) to make setup incredibly simple. Docker allows applications to run in isolated environments, so you don't have to worry about complex installations or conflicts with other software on your computer.

### 1. Install Docker Desktop

If you don't have Docker installed, you'll need to get [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your operating system (macOS, Windows, or Linux). Follow the installation instructions on their website.

**Important**: Make sure Docker Desktop is running before proceeding! You'll usually see a Docker icon in your system tray or menu bar.

### 2. Start FocusOS

Navigate to the `habit_tracker` directory (where this `README.md` file is located) in your terminal or command prompt.

Then, run the following command:

```bash
docker-compose up --build
```

-   `docker-compose up`: This command tells Docker to start all the necessary components for FocusOS.
-   `--build`: This ensures that Docker builds the application from the latest code, which is good for the first run or after updates.

### 3. Access FocusOS

Once the command finishes (it might take a few minutes the first time), you can access FocusOS:

-   **Web Interface (UI)**: Open your web browser and go to: [http://localhost:8000/ui](http://localhost:8000/ui)
-   **API (Developers)**: The backend API is available at: [http://localhost:8000](http://localhost:8000)

### 4. Stopping FocusOS

To stop FocusOS and free up system resources, go back to your terminal (press `Ctrl+C` if the `docker-compose up` command is still running) and then execute:

```bash
docker-compose down
```

This will stop and remove the Docker containers associated with FocusOS.

### 5. Data Persistence

Your FocusOS data is safely stored in `backend/data/habit_tracker.db` within this project's directory. This means your habits, milestones, and reflections will persist even if you stop and restart FocusOS.

## 🧑‍💻 For Developers & Contributors

Welcome! This section provides quick links and notes for those looking to dive deeper into FocusOS development.

### Project Overview & Vision
-   **Strategic Overview & Development Guide**: [`GEMINI.md`](GEMINI.md)
-   **Action Plan**: [`docs/ACTIONPLAN.md`](docs/ACTIONPLAN.md)

### Architecture & Logic
-   **Habit Architecture**: [`docs/HABIT_ARCHITECTURE.md`](docs/HABIT_ARCHITECTURE.md)
-   **Logic Rules**: [`docs/LOGIC_RULES.md`](docs/LOGIC_RULES.md)

### Frontend Development
-   **Frontend Guide**: [`docs/frontend/FRONTEND_GUIDE.md`](docs/frontend/FRONTEND_GUIDE.md)
-   **UI Design Glossary**: [`docs/DESIGN_GLOSSARY.md`](docs/DESIGN_GLOSSARY.md)
-   **UI Panel Documentation**: [`docs/UI_PANELS_DOCUMENTATION.md`](docs/UI_PANELS_DOCUMENTATION.md)

### Testing
-   **Testing Mandates**: [`docs/TESTING_MANDATES.md`](docs/TESTING_MANDATES.md)
-   Run backend tests: `pytest backend/tests` (from project root)
-   Run frontend tests: `node --test backend/frontend/**/*.test.mjs` (from project root)

### Project Layout
-   `backend/`: FastAPI application, models, schemas, and frontend assets.
-   `backend/tests/`: Pytest suite for backend components.
-   `backend/frontend/`: All frontend (HTML, CSS, JavaScript) source files.
-   `docker-compose.yml`: Defines how Docker runs the FocusOS services.
-   `utils/`: Utility scripts (e.g., database synchronization).

### Contributing

Small, test-backed PRs are always welcome. Please ensure your changes align with the existing architectural principles and coding standards.

## 📄 License

MIT License. See `LICENSE` for details.