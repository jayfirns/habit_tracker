Here's a comprehensive `README.md` file for your habit tracker application. This README will provide a clear overview of your application, its purpose, setup instructions, usage, and additional information for users or contributors.

### README.md

# My Personal Habit Tracker

A simple and intuitive Habit Tracker application built using Python and Tkinter. This application helps users to track their habits, view their progress, and manage habit-related notes effectively. The application supports adding, editing, deleting habits, and scheduling notifications for daily habits.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Logging](#logging)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Habit Management**: Add, edit, delete, and track habits.
- **Progress Visualization**: View habit progress through a calendar or a line chart.
- **Notes Management**: Add, edit, and delete notes associated with each habit.
- **Customizable Notifications**: Schedule daily notifications for habits.
- **User Preferences**: Save window size, position, and column settings for a personalized experience.
- **Configurable UI**: Easily customize the display of columns and window settings.

## Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/habit-tracker.git
    cd habit-tracker
    ```

2. **Create a virtual environment** (optional but recommended):
    On mac/linux:
    ```zsh
    python -m venv myenv
    source myenv/bin/activate  
    ```
    On Windows: 
    ```bash
    myenv\Scripts\activate
    ```

3. **Install the required dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

   Ensure that `requirements.txt` includes the necessary packages, such as:
   - `tkinter` (usually included with Python)
   - `sqlite3` (standard library in Python)
   - `matplotlib`
   - `logging`

4. **Run the application**:

    ```bash
    python habit_tracker.py
    ```

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

Contributions are welcome! If you'd like to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add new feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a pull request.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Troubleshooting

- **Application does not start**: Ensure all dependencies are installed correctly and Python is updated to the latest version.
- **Preferences not saved**: Check the file permissions of `config.ini` and ensure the application has write access to its directory.
- **Errors during load or save preferences**: Review the log file (`habit_tracker.log`) for detailed error messages and traceback information.

---

Enjoy tracking your habits and achieving your goals!


### Explanation of Key Sections

- **Features**: Lists the primary functionalities of the application.
- **Installation**: Provides step-by-step instructions for setting up the application.
- **Usage**: Explains how to use different features of the app.
- **Configuration**: Details how user preferences are stored and can be modified.
- **Logging**: Mentions the logging functionality for debugging.
- **Contributing**: Offers guidance for users who want to contribute to the project.
- **License**: States the type of license under which the software is distributed.
- **Troubleshooting**: Provides common issues and solutions.

