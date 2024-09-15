---
created: 2024-09-14T18:22
updated: 2024-09-14T18:40
---
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

    ```bash
    python -m venv myenv
    source myenv/bin/activate  # On Windows: myenv\Scripts\activate
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



### Explanation of Key Sections

- **Features**: Lists the primary functionalities of the application.
- **Installation**: Provides step-by-step instructions for setting up the application.
- **Usage**: Explains how to use different features of the app.
- **Configuration**: Details how user preferences are stored and can be modified.
- **Logging**: Mentions the logging functionality for debugging.
- **Contributing**: Offers guidance for users who want to contribute to the project.
- **License**: States the type of license under which the software is distributed.
- **Troubleshooting**: Provides common issues and solutions.


# Starting a Virtual Environment on the Mac

To start a virtual environment on your MacBook, follow these steps:

### Step 1: Create and Activate a Virtual Environment
1. **Create a Virtual Environment**:
   In your project directory, create a virtual environment named `myenv` (or any name you prefer):
   ```bash
   python3 -m venv myenv
   ```
2. **Activate the Virtual Environment**:
   Activate the virtual environment using the following command:
   ```bash
   source myenv/bin/activate
   ```
   Once activated, you should see the virtual environment name (e.g., `(myenv)`) at the beginning of your terminal prompt.
### Step 2: Check and Install Dependencies
Since you provided a list of libraries required by your script, here are the steps to ensure they are installed:
1. **Create a `requirements.txt` File**:
   If you don't have a `requirements.txt` file, you can create one with the following content:
   ```
   tk
   tkcalendar
   matplotlib
   ```
   The other libraries (`sqlite3`, `datetime`, `threading`, `time`, `configparser`, `logging`) are built-in Python libraries and do not need to be installed separately.
2. **Install the Required Libraries**:
   Run the following command to install the libraries listed in `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

### Step 3: Verify Installation
After installing, verify that all dependencies are correctly installed:
```bash
pip list
```
### Step 4: Run Your Python Script
With the virtual environment activated and dependencies installed, you can now run your Python script:
```bash
python habit_tracker.py
```
