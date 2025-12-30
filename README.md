### README.md

# FocusOS (Habit Board)

A local-first habit and goals board served by FastAPI with a lightweight HTML/CSS/JS frontend. Track habits, SMART goals, workday time, and focused minutes without the cloud. The legacy Tkinter app remains in the repo, but the primary experience is now the FocusOS web UI (`backend/frontend`).

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Logging](#logging)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Habit Management**: Add, edit, delete, and mark completions with notes; per-habit stopwatches and manual minute overrides.
- **SMART Goals**: Create/assign habits to SMART goals, reflect, and edit from the dashboard.
- **Workday Time Glide**: Plan a day, clock out early, or override worked minutes; see planned vs. worked and focused percentages.
- **Analytics**: Today’s Focus, Energy Mix pie chart, and daily time summary (Planned | Worked | % Plan | Focused | % Focused).
- **Theming & UX**: Multiple themes, responsive layout, and inline habit editing.

## Running the web app (dev)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .[dev]
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/ui` for the frontend. API lives at `http://localhost:8000`.

Docker: `docker-compose up --build` will run the backend and serve the UI on :8000.

## Usage

### Main Window

- **Add Habit**: Enter the habit name and category in the input fields and click the "Add Habit" button.
- **Edit Habit**: Select a habit from the list and click the "Edit Habit" button to modify its details.
- **Delete Habit**: Select a habit from the list and click the "Delete Habit" button to remove it.
- **Mark as Done Today**: Select a habit and click "Mark as Done Today" to record a completion for today.
- **View/Edit Notes**: Select a habit and click "View/Edit Notes" to manage notes associated with the habit.
- **View Progress**: Click "View Progress" to display the completion history in a calendar view.
- **Show Chart**: Click "Show Chart" to visualize habit completion trends over time.

### Configuration

The application uses a `config.ini` file to store user preferences such as window size, position, and column settings.

- **Window Settings**: Saved under the `[Window]` section, including width, height, x, and y coordinates.
- **Column Settings**: Saved under the `[Columns]` section, storing column widths and order.

### Editing Configuration

To manually update preferences, edit the `config.ini` file. This file will be created automatically when the application is first run.

Example `config.ini` file:

```ini
[Window]
width = 1061
height = 746
x = 1573
y = 288

[Columns]
Name_width = 150
Name_position = 0
Category_width = 150
Category_position = 1
Streak_width = 150
Streak_position = 2
Daily Completions_width = 150
Daily Completions_position = 3
Recent Note_width = 150
Recent Note_position = 4
```

### Logging

The application uses Python's `logging` module to record various actions and states, which is helpful for debugging and monitoring the app's behavior. The log file is saved as `habit_tracker.log`.

### Contributing

PRs welcome—favor small, test-backed changes. Frontend is vanilla JS/CSS; backend uses FastAPI + SQLAlchemy. Add or update tests when changing behavior (see `backend/tests` and `backend/frontend/time-utils.test.mjs`).

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Troubleshooting

- **Application does not start**: Ensure all dependencies are installed correctly and Python is updated to the latest version.
- **Preferences not saved**: Check the file permissions of `config.ini` and ensure the application has write access to its directory.
- **Errors during load or save preferences**: Review the log file (`habit_tracker.log`) for detailed error messages and traceback information.

---

Enjoy tracking your habits and achieving your goals!

## FocusOS Backend (Docker Quickstart)

A FastAPI backend for the FocusOS web migration lives in `backend/`.

- Build: `docker build -t focusos-backend ./backend`
- Run: `docker run -p 8000:8000 focusos-backend`
- Or with Compose (runs backend on :8000): `docker-compose up --build backend`
- Data: SQLite lives in `backend/data/habit_tracker.db` (mounted into the container); your habits persist across rebuilds.


### Explanation of Key Sections

- **Features**: Lists the primary functionalities of the application.
- **Installation**: Provides step-by-step instructions for setting up the application.
- **Usage**: Explains how to use different features of the app.
- **Configuration**: Details how user preferences are stored and can be modified.
- **Logging**: Mentions the logging functionality for debugging.
- **Contributing**: Offers guidance for users who want to contribute to the project.
- **License**: States the type of license under which the software is distributed.
- **Troubleshooting**: Provides common issues and solutions.
