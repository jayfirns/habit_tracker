"""
habit_tracker

This project was created with ChatGPTo1

Author: John Firnschild
Written: 9/14/2024
Version: 0.4.2

Need to add more details to config file.  I want the columns to be dynamicly saved.

"""
import tkinter as tk
from tkinter import messagebox, simpledialog
from tkinter import ttk
import sqlite3
from datetime import date, datetime, timedelta
import threading
import time
import configparser
from tkcalendar import Calendar
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import logging

# Set up the logger
logging.basicConfig(
    filename='habit_tracker_log.log',           # Log file name
    filemode='a',                 # Append mode
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.DEBUG           # Set the minimum log level to DEBUG
)

# Install required packages:
# pip install tkcalendar matplotlib

# Connect to SQLite database (or create it if it doesn't exist)
logging.debug("------------------------------------------------------------")
logging.debug("------------------------------------------------------------")
logging.debug("Establishing connection to habit_tracker.db")
logging.debug("------------------------------------------------------------")
logging.debug("------------------------------------------------------------")
conn = sqlite3.connect('habit_tracker.db')
cursor = conn.cursor()

# Create tables for habits and completions
cursor.execute('''
    CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        streak INTEGER DEFAULT 0,
        last_completed TEXT
    )
''')

cursor.execute('''
    CREATE TABLE IF NOT EXISTS completions (
        habit_id INTEGER,
        date TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits (id)
    )
''')
conn.commit()

config = configparser.ConfigParser()
config.read('config.ini')

class HabitTrackerApp:
    def __init__(self, master):
        """
        Initializes the HabitTrackerApp class.

        Parameters:
        master (tk.Tk): The root window or main frame for the habit tracker application.

        This method sets the application title, initializes instance variables for habit and category,
        loads user preferences, creates the user interface elements, loads existing habits, 
        and schedules notifications for habit tracking.
        """
        self.master = master
        master.title("My Personal Habit Tracker")
        logging.debug("------------------------------------------------------------")
        logging.debug("Initialized Habit Tracker App")
        logging.debug("------------------------------------------------------------")
        # Set window icon if desired
        # master.iconbitmap('path_to_icon.ico')

        self.habit_name_var = tk.StringVar()
        self.category_var = tk.StringVar()
        self.selected_habit = None

        # Load user preferences
        self.load_preferences()
        logging.debug("Preferences Loaded")

        # Create UI elements
        self.create_widgets()
        logging.debug("UI Elements Created")
        # Load existing habits
        self.load_habits()
        logging.debug("Habits Loaded")
        # Schedule notifications
        self.schedule_notifications()
        logging.debug("Scheduling Notifications...  I don't think this is working.")

    def create_widgets(self):
        """
        Creates and arranges all user interface (UI) elements for the Habit Tracker application.

        This method sets up several frames within the main window to hold different UI components:
        - An input frame for entering new habits and their categories.
        - A list frame to display existing habits in a table format with columns for Name, Category, Streak, 
        Daily Completions, and the most recent Note.
        - An action frame with buttons for managing habits (e.g., marking them as done, viewing progress, editing, deleting).
        - A progress frame for displaying progress bars related to habit tracking.
        - A button to view or edit notes associated with each habit.

        UI elements are positioned using a grid layout manager to organize widgets within frames.
        """
        logging.debug("Initializing create_widgets method")
        # Habit input frame
        input_frame = ttk.Frame(self.master)
        input_frame.grid(row=0, column=0, padx=10, pady=10, sticky='ew')

        ttk.Label(input_frame, text="Habit Name:").grid(row=0, column=0, padx=5, pady=5)
        ttk.Entry(input_frame, textvariable=self.habit_name_var).grid(row=0, column=1, padx=5, pady=5)
        ttk.Label(input_frame, text="Category:").grid(row=0, column=2, padx=5, pady=5)
        ttk.Entry(input_frame, textvariable=self.category_var).grid(row=0, column=3, padx=5, pady=5)
        ttk.Button(input_frame, text="Add Habit", command=self.add_habit).grid(row=0, column=4, padx=5, pady=5)

        # Habit list frame
        list_frame = ttk.Frame(self.master)
        list_frame.grid(row=1, column=0, padx=10, pady=10, sticky='nsew')
        self.master.grid_rowconfigure(1, weight=1)

        # Updated columns to include daily completions and recent note
        columns = ('Name', 'Category', 'Streak', 'Daily Completions', 'Recent Note')
        self.habit_tree = ttk.Treeview(list_frame, columns=columns, show='headings')

        # Configure each column
        for col in columns:
            self.habit_tree.heading(col, text=col)
            self.habit_tree.column(col, minwidth=0, width=150, stretch=tk.YES)

        self.habit_tree.pack(fill='both', expand=True)
        self.habit_tree.bind('<<TreeviewSelect>>', self.on_habit_select)

        # Action buttons frame
        action_frame = ttk.Frame(self.master)
        action_frame.grid(row=2, column=0, padx=10, pady=10, sticky='ew')

        ttk.Button(action_frame, text="Mark as Done Today", command=self.mark_done).grid(row=0, column=0, padx=5, pady=5)
        ttk.Button(action_frame, text="View Progress", command=self.view_progress).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(action_frame, text="Show Chart", command=self.show_chart).grid(row=0, column=2, padx=5, pady=5)
        ttk.Button(action_frame, text="Edit Habit", command=self.edit_habit).grid(row=0, column=3, padx=5, pady=5)
        ttk.Button(action_frame, text="Delete Habit", command=self.delete_habit).grid(row=0, column=4, padx=5, pady=5)
        
        # Add the new button for viewing/editing notes
        ttk.Button(action_frame, text="View/Edit Notes", command=self.view_edit_notes).grid(row=0, column=5, padx=5, pady=5)

        # Progress bars frame
        self.progress_frame = ttk.Frame(self.master)
        self.progress_frame.grid(row=3, column=0, padx=10, pady=10, sticky='ew')

    def view_edit_notes(self):
        """
        Opens a window to view and edit notes associated with the selected habit.

        This method creates a new window that displays all notes for the currently selected habit.
        Users can add new notes, edit existing notes, or delete notes. Changes are saved to the 
        database, and the notes list is updated accordingly.

        Raises:
        - messagebox.showwarning: Warns the user if no habit is selected from the list.
        """
        logging.debug("Initializing view_edit_notes method")

        if not self.selected_habit:
            messagebox.showwarning("Selection Error", "Please select a habit to view or edit notes.")
            logging.warning("Selection Error: No habit selected.")
            return

        habit_id = self.selected_habit[0]
        habit_name = self.selected_habit[1]

        # Create a new window for viewing/editing notes
        notes_window = tk.Toplevel(self.master)
        notes_window.title(f"View/Edit Notes for '{habit_name}'")
        logging.debug(f"Displaying new window for view/edit on {habit_name}")

        # Fetch existing notes for the selected habit
        cursor.execute('SELECT id, note FROM completions WHERE habit_id = ? AND note IS NOT NULL', (habit_id,))
        notes = cursor.fetchall()
        logging.debug("Fetching Notes for Selected habit.")

        # Frame to hold notes
        notes_frame = ttk.Frame(notes_window)
        notes_frame.pack(fill='both', expand=True, padx=10, pady=10)

        # Listbox to display notes
        notes_listbox = tk.Listbox(notes_frame, height=10, width=50)
        notes_listbox.pack(side='left', fill='both', expand=True)
        logging.debug("Initializing listbox to display notes.")

        # Scrollbar for the notes list
        scrollbar = ttk.Scrollbar(notes_frame, orient='vertical', command=notes_listbox.yview)
        scrollbar.pack(side='right', fill='y')
        notes_listbox.config(yscrollcommand=scrollbar.set)

        # Populate the listbox with notes
        for note in notes:
            notes_listbox.insert(tk.END, note[1])
            logging.debug("Populated listbox to display notes.")

        # Function to handle adding a new note
        def add_note():
            """
            Opens a custom dialog window to add a new note.

            This function creates a new window with a multiline text area where the user can enter a new note.
            The note is then saved to the database and displayed in the listbox if the user chooses to save it.
            """
            logging.debug("Initializing add_note method")

            # Create a new window for adding a note
            add_note_window = tk.Toplevel(notes_window)
            add_note_window.title("Add Note")
            logging.debug("Display window for Add Note.")

            # Multiline text input for the new note
            note_text = tk.Text(add_note_window, height=10, width=50)
            note_text.pack(padx=10, pady=10)

            def save_new_note():
                new_note = note_text.get("1.0", tk.END).strip()  # Get the note text
                if new_note:
                    cursor.execute('INSERT INTO completions (habit_id, date, note) VALUES (?, ?, ?)', 
                                (habit_id, date.today().isoformat(), new_note))
                    conn.commit()
                    logging.debug("New note inserted.")
                    notes_listbox.insert(tk.END, new_note)
                    add_note_window.destroy()  # Close the window after saving

            # Save and Cancel buttons
            ttk.Button(add_note_window, text="Save", command=save_new_note).pack(pady=5)
            ttk.Button(add_note_window, text="Cancel", command=add_note_window.destroy).pack(pady=5)

        # Function to handle editing a selected note
        def edit_note():
            """
            Opens a custom dialog window to edit the selected note.

            This function opens a new window with a multiline text area pre-filled with the selected note.
            The user can modify the note, and upon saving, the changes are updated in the database and the listbox.
            """
            logging.debug("Initializing edit_note method")

            selected_index = notes_listbox.curselection()
            if not selected_index:
                messagebox.showwarning("Edit Error", "Please select a note to edit.")
                logging.warning("Edit Error: No note selected to edit.")
                return

            selected_note = notes_listbox.get(selected_index)

            # Create a new window for editing the note
            edit_note_window = tk.Toplevel(notes_window)
            edit_note_window.title("Edit Note")

            # Multiline text input pre-filled with the existing note
            note_text = tk.Text(edit_note_window, height=10, width=50)
            note_text.insert("1.0", selected_note)  # Insert the existing note text
            note_text.pack(padx=10, pady=10)

            def save_edited_note():
                new_note = note_text.get("1.0", tk.END).strip()  # Get the updated note text
                if new_note:
                    note_id = notes[selected_index[0]][0]  # Get the ID of the selected note
                    cursor.execute('UPDATE completions SET note = ? WHERE id = ?', (new_note, note_id))
                    conn.commit()
                    logging.debug(f"Updating note.id: {note_id} with new note")
                    notes_listbox.delete(selected_index)
                    notes_listbox.insert(selected_index, new_note)
                    edit_note_window.destroy()  # Close the window after saving

            # Save and Cancel buttons
            ttk.Button(edit_note_window, text="Save", command=save_edited_note).pack(pady=5)
            ttk.Button(edit_note_window, text="Cancel", command=edit_note_window.destroy).pack(pady=5)

        # Function to handle deleting a selected note
        def delete_note():
            """
            Deletes the selected note from the database and the listbox.

            This function checks if a note is selected and confirms deletion with the user.
            If confirmed, the note is deleted from the database and removed from the listbox.
            """
            logging.debug("Initializing delete_note method")

            selected_index = notes_listbox.curselection()
            if not selected_index:
                messagebox.showwarning("Delete Error", "Please select a note to delete.")
                logging.warning("Delete Error: No note selected for deletion.")
                return

            confirmation = messagebox.askyesno("Delete Note", "Are you sure you want to delete the selected note?")
            if confirmation:
                note_id = notes[selected_index[0]][0]  # Get the ID of the selected note
                cursor.execute('DELETE FROM completions WHERE id = ?', (note_id,))
                conn.commit()
                logging.info("Note Deleted.")
                notes_listbox.delete(selected_index)

        # Buttons for adding, editing, and deleting notes
        ttk.Button(notes_window, text="Add Note", command=add_note).pack(pady=5)
        ttk.Button(notes_window, text="Edit Note", command=edit_note).pack(pady=5)
        ttk.Button(notes_window, text="Delete Note", command=delete_note).pack(pady=5)





    def add_habit(self):
        logging.debug("Initializing add_habit method")
        """
        Adds a new habit to the habit tracker.

        This method retrieves the habit name and category entered by the user, 
        validates that both fields are not empty, and then inserts the new habit into the database.
        If the input fields are valid, the habit is added to the database, the input fields are cleared, 
        and the habit list is reloaded to reflect the changes. If either field is empty, a warning message 
        is displayed to the user.

        Raises:
        - messagebox.showwarning: If the habit name or category is not provided.
        """

        habit_name = self.habit_name_var.get().strip()
        category = self.category_var.get().strip()
        if habit_name and category:
            cursor.execute('INSERT INTO habits (name, category) VALUES (?, ?)', (habit_name, category))
            conn.commit()
            logging.info(f"Habit added: {habit_name} - {category}")
            self.habit_name_var.set('')
            self.category_var.set('')
            self.load_habits()
        else:
            messagebox.showwarning("Input Error", "Please enter both habit name and category.")
            logging.warning("Input Error: No Habit Name or Category provided.")

    def load_habits(self):
        """
        Loads and displays the list of habits in the Treeview widget, including daily completion count and recent notes.

        This method clears the existing entries in the Treeview, fetches the list of habits, their daily completion counts, 
        and the most recent note associated with each habit from the database. Each habit is then inserted into the 
        Treeview sorted by category and name. After populating the Treeview, the method also updates the progress bars 
        to reflect the current habit data.

        Calls:
        - self.update_progress_bars: Updates the progress bars based on the loaded habits.
        """
        logging.debug("Initializing load_habits method")

        # Clear the Treeview
        for item in self.habit_tree.get_children():
            self.habit_tree.delete(item)
        
        # Query to fetch habits, their daily completion counts, and the most recent note
        cursor.execute('''
            SELECT h.id, h.name, h.category, h.streak,
                COUNT(c.date) AS daily_count,
                (SELECT note 
                    FROM completions 
                    WHERE habit_id = h.id 
                    ORDER BY id DESC LIMIT 1) AS recent_note
            FROM habits h
            LEFT JOIN completions c ON h.id = c.habit_id AND c.date = CURRENT_DATE
            GROUP BY h.id, h.name, h.category, h.streak
            ORDER BY h.category, h.name
        ''')
        
        self.habits = cursor.fetchall()
        logging.debug("Completed fetching all habits, including recent notes.")

        # Insert habit data into the Treeview, including the daily count and the most recent note
        for habit in self.habits:
            # Handle potential None values for recent notes
            recent_note = habit[5] if habit[5] else ""
            self.habit_tree.insert('', tk.END, values=(habit[1], habit[2], f"{habit[3]} days", f"{habit[4]} completions today", recent_note))

        self.update_progress_bars()

    def on_habit_select(self, event):
        logging.debug("Initializing on_habit_select method")
        """
        Handles the selection of a habit in the Treeview widget.

        This method is triggered when a user selects a habit from the Treeview.
        It retrieves the selected item's details and updates the `self.selected_habit` 
        attribute with the corresponding habit data from the loaded habits. 
        If no item is selected, `self.selected_habit` is set to None.

        Parameters:
        - event: The event object generated when an item is selected in the Treeview.
        """

        selected_item = self.habit_tree.focus()
        if selected_item:
            values = self.habit_tree.item(selected_item, 'values')
            habit_name = values[0]
            # Find the habit in self.habits
            for habit in self.habits:
                if habit[1] == habit_name:
                    self.selected_habit = habit
                    break
        else:
            self.selected_habit = None

    def mark_done(self):
        logging.debug("Initializing mark_done method")
        """
        Marks the selected habit as completed for today and prompts the user to enter a note.

        This method updates the completion status of the currently selected habit.
        If a habit is selected, it inserts a record of today's completion into the database,
        prompts the user to enter a note about the completion, and calculates and updates 
        the habit's streak based on the last completion date. The habits list is then 
        reloaded to reflect the changes. A success message is displayed if the update 
        is successful. If no habit is selected, a warning message is shown.

        Raises:
        - messagebox.showinfo: Informs the user that the habit was successfully marked as done.
        - messagebox.showwarning: Warns the user if no habit is selected from the list.
        """
        
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            today = date.today()
            today_str = today.isoformat()

            # Prompt user to enter a note for today's completion
            note = simpledialog.askstring("Add Note", "Enter a note for today's completion:", parent=self.master)

            # Insert completion record, allowing multiple entries per day
            cursor.execute('INSERT INTO completions (habit_id, date, note) VALUES (?, ?, ?)', (habit_id, today_str, note))
            logging.debug("Updated daily completions.")

            # Get the last completed date and current streak from the habits table
            cursor.execute('SELECT last_completed, streak FROM habits WHERE id = ?', (habit_id,))
            result = cursor.fetchone()
            logging.debug(f"Returned result: {result} from last_completed habit: {habit_id}")
            last_completed_str, streak = result
            last_completed = date.fromisoformat(last_completed_str) if last_completed_str else None
            logging.debug(f"mark_done: last_completed = {last_completed}")

            # Update streak only if it hasn't already been updated today
            if last_completed != today:
                if last_completed == today - timedelta(days=1):
                    streak += 1
                else:
                    streak = 1

                # Update habit record with new streak and last completed date
                cursor.execute('UPDATE habits SET streak = ?, last_completed = ? WHERE id = ?', (streak, today_str, habit_id))
                logging.debug("mark_done: Habit record updated.")

            conn.commit()
            self.load_habits()

            messagebox.showinfo("Success", f"Habit marked as done for today! Current streak: {streak} days.")
            logging.info(f"Habit marked as done for today! Current streak: {streak} days.")
        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")
            logging.warning("Selection Erro: no selection made from habit list")



    def update_progress_bars(self):
        """
        Updates the progress bars for each habit based on total and daily completion data.

        This method clears any existing progress bars in the progress frame and calculates the 
        progress for each habit by fetching the total number of completions and today's completions 
        from the database. A progress bar is created for each habit, displaying its name, category, 
        and progress toward a predefined goal of 30 completions (used for demonstration purposes). 
        Progress is capped at a maximum of 100%.

        The progress bars also show the daily completions count to provide a quick view of the 
        habit performance for the current day.

        The progress bars are dynamically displayed in the application window.

        Notes:
        - The `recent_note` column fetched from the database is not used in this method, as it does 
        not contribute to the visualization of habit progress.
        """
        logging.debug("Initializing update_progress_bars method")

        # Clear existing progress bars
        for widget in self.progress_frame.winfo_children():
            widget.destroy()

        # Fetch completions and calculate progress
        for habit in self.habits:
            habit_id, habit_name, category, streak, daily_count, _ = habit  # Unpack recent_note but do not use it

            # Calculate total completions
            cursor.execute('SELECT COUNT(*) FROM completions WHERE habit_id = ?', (habit_id,))
            total_completions = cursor.fetchone()[0]
            logging.debug("Calculating total completions")
            logging.info(f"update_progress_bars: total_completions = {total_completions}")

            # For demonstration, set a goal of 30 completions
            goal = 30
            progress = int((total_completions / goal) * 100) if goal else 0
            progress = min(progress, 100)  # Cap at 100%

            # Display habit name, category, daily completions, and progress bar
            frame = ttk.Frame(self.progress_frame)
            frame.pack(fill='x', pady=2)

            ttk.Label(frame, text=f"{habit_name} ({category}) - {daily_count} completions today").pack(side='left')
            progress_bar = ttk.Progressbar(frame, length=200, value=progress)
            progress_bar.pack(side='right', padx=10)


    def view_progress(self):
        logging.debug("Initializing view_progress method")
        """
        Displays the completion progress of the selected habit on a calendar, including notes for each completion.

        This method opens a new window containing a calendar widget that highlights the dates 
        on which the selected habit was completed. Each highlighted date includes a tooltip or 
        popup showing the note associated with that completion, if available. If no completions 
        are recorded for the selected habit, an informational message is shown to the user. 
        If no habit is selected, a warning message is displayed.

        Raises:
        - messagebox.showinfo: Informs the user if no completions are recorded for the selected habit.
        - messagebox.showwarning: Warns the user if no habit is selected from the list.
        """
        
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            habit_name = self.selected_habit[1]

            # Fetch completion dates and their associated notes
            cursor.execute('SELECT date, note FROM completions WHERE habit_id = ?', (habit_id,))
            completions = cursor.fetchall()
            logging.debug("Fetching completion dates and their associated notes.")
            completion_data = [(date.fromisoformat(c[0]), c[1]) for c in completions]
            logging.info(f"view_progress: completion_data = {completion_data} for {habit_id}")

            if not completion_data:
                messagebox.showinfo("Progress", f"No completions recorded for '{habit_name}'.")
                logging.info(f"Progress, No completions recorded for '{habit_name}'.")
                return

            # Create a new window for the calendar
            cal_window = tk.Toplevel(self.master)
            cal_window.title(f"Progress for '{habit_name}'")
            logging.debug(f"Display calendar window progress for '{habit_name}'")

            # Create a Calendar widget
            cal = Calendar(cal_window, selectmode='none')
            cal.pack(padx=10, pady=10)

            # Highlight completion dates and associate notes
            for completion_date, note in completion_data:
                cal.calevent_create(completion_date, 'Completed', 'completed')
                if note:
                    # Add a tooltip or similar display for notes
                    cal.calevent_create(completion_date, f"Note: {note}", 'note')

            # Define tag styles
            cal.tag_config('completed', background='green', foreground='white')
            cal.tag_config('note', background='yellow', foreground='black')  # Style for notes

        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")
            logging.warning("Selection Error: no habit selected from list.")


    def show_chart(self):
        logging.debug("Initializing show_chart method")
        """
        Displays a line chart showing the completion trend of the selected habit over time, including notes for each completion date.

        This method retrieves the completion dates and associated notes of the selected habit from the database and 
        plots them on a line chart to visualize the trend of habit completions. The notes for each completion date 
        are displayed as tooltips on the chart. If no data is available for the selected habit, an informational 
        message is shown. If no habit is selected, a warning message is displayed.

        The chart is displayed in a new window embedded within the Tkinter interface.

        Raises:
        - messagebox.showinfo: Informs the user if no completion data is available for the selected habit.
        - messagebox.showwarning: Warns the user if no habit is selected from the list.
        """
        
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            habit_name = self.selected_habit[1]

            # Fetch completion dates and associated notes
            cursor.execute('SELECT date, note FROM completions WHERE habit_id = ?', (habit_id,))
            completions = cursor.fetchall()
            logging.debug("Fetching all completion dates and associated notes")
            completion_data = [(date.fromisoformat(c[0]), c[1]) for c in completions]
            logging.info(f"show_chart: completion_data = {completion_data}")

            if not completion_data:
                messagebox.showinfo("No Data", f"No completion data to display for '{habit_name}'.")
                logging.info(f"No Data, No completion data to display for '{habit_name}'.")
                return

            # Prepare data for plotting
            completion_data.sort(key=lambda x: x[0])  # Sort by date
            date_counts = {}
            notes_by_date = {}

            for d, note in completion_data:
                date_counts[d] = date_counts.get(d, 0) + 1
                if note:
                    if d not in notes_by_date:
                        notes_by_date[d] = []
                    notes_by_date[d].append(note)  # Collect all notes for a specific date

            dates_list = list(date_counts.keys())
            completions_list = [date_counts[d] for d in dates_list]

            # Create a figure
            fig, ax = plt.subplots(figsize=(6, 4))
            ax.plot(dates_list, completions_list, marker='o')
            ax.set_title(f"Completion Trend for '{habit_name}'")
            ax.set_xlabel('Date')
            ax.set_ylabel('Completions')
            ax.grid(True)

            # Add notes as annotations on the chart
            for d, count in zip(dates_list, completions_list):
                if d in notes_by_date:
                    note_text = "\n".join(notes_by_date[d])  # Combine notes for the same date
                    ax.annotate(note_text, (d, count), textcoords="offset points", xytext=(0, 10), ha='center', fontsize=8, color='blue')

            # Format date axis
            fig.autofmt_xdate()

            # Embed the plot in the Tkinter window
            chart_window = tk.Toplevel(self.master)
            chart_window.title(f"Chart for '{habit_name}'")
            canvas = FigureCanvasTkAgg(fig, master=chart_window)
            canvas.draw()
            canvas.get_tk_widget().pack()
        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")


    def edit_habit(self):
        logging.debug("Initializing edit_habit method")
        """
        Allows the user to edit the name and category of the selected habit.

        This method prompts the user to input a new name and category for the selected habit.
        If both inputs are provided, the habit is updated in the database, and the list of habits 
        is reloaded to reflect the changes. If either input is missing or no habit is selected, 
        a warning message is displayed to the user.

        Raises:
        - messagebox.showwarning: Warns the user if no habit is selected or if either the habit name 
        or category is not provided during editing.
        """

        if self.selected_habit:
            habit_id = self.selected_habit[0]
            old_name = self.selected_habit[1]
            old_category = self.selected_habit[2]

            # Prompt for new name and category
            new_name = simpledialog.askstring("Edit Habit", "Enter new name:", initialvalue=old_name)
            new_category = simpledialog.askstring("Edit Habit", "Enter new category:", initialvalue=old_category)
            if new_name and new_category:
                cursor.execute('UPDATE habits SET name = ?, category = ? WHERE id = ?', (new_name.strip(), new_category.strip(), habit_id))
                conn.commit()
                logging.info(f"Successfully created new name: {new_name} and new category: {new_category}")
                self.load_habits()
            else:
                messagebox.showwarning("Input Error", "Please enter both habit name and category.")
                logging.warning("Input Error: Please enter both habit name and category.")
        else:
            messagebox.showwarning("Selection Error", "Please select a habit to edit.")
            logging.warning("Selection Error: Please select a habit to edit.")

    def delete_habit(self):
        logging.debug("Initializing delete_habit method")
        """
        Deletes the selected habit from the habit tracker.

        This method prompts the user to confirm the deletion of the selected habit.
        If confirmed, the habit and its associated completion records are removed 
        from the database, and the list of habits is reloaded to reflect the deletion. 
        If no habit is selected, a warning message is displayed to the user.

        Raises:
        - messagebox.askyesno: Asks the user for confirmation before deleting the habit.
        - messagebox.showwarning: Warns the user if no habit is selected from the list.
        """

        if self.selected_habit:
            habit_id = self.selected_habit[0]
            habit_name = self.selected_habit[1]

            # Confirm deletion
            confirm = messagebox.askyesno("Delete Habit", f"Are you sure you want to delete '{habit_name}'?")
            if confirm:
                cursor.execute('DELETE FROM habits WHERE id = ?', (habit_id,))
                cursor.execute('DELETE FROM completions WHERE habit_id = ?', (habit_id,))
                conn.commit()
                logging.warning(f"{habit_name}!")
                self.load_habits()
        else:
            messagebox.showwarning("Selection Error", "Please select a habit to delete.")
            logging.warning("Selection Error: Please select a habit to delete.")


    def schedule_notifications(self):
        logging.debug("Initializing schedule_notifications method")
        """
        Schedules daily notifications for the habit tracker application.

        This method creates a background thread that waits until specific times (8 AM, 2 PM, and 8 PM) each day 
        to trigger notifications. Once the target time is reached, it schedules a call to the 
        `show_notification` method on the main thread using Tkinter's `after` method. The 
        notification process repeats daily for each target time.

        Notes:
        - The notifications are scheduled in a separate daemon thread to prevent blocking the main application thread.
        """

        # Schedule notifications at multiple times during the day
        def notify():
            logging.debug("Initializing notify method")
            # Define target notification times (8 AM, 2 PM, and 8 PM)
            notification_times = [8, 12, 20]  # hours in 24-hour format
            logging.debug(f"Notification Times: {notification_times}")

            while True:
                now = datetime.now()
                logging.info(f"notify noted time as: {now}")
                # Calculate the next target time today or tomorrow
                for hour in notification_times:
                    target_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
                    logging.info(f"notify noted target time as: {target_time}")
                    
                    if now >= target_time:
                        logging.warning(f"{now} >= {target_time}")
                        target_time += timedelta(days=1)
                        logging.info(f"target_time now set to: {target_time}")
                    
                    # Calculate the number of seconds to wait until the next target time
                    wait_seconds = (target_time - now).total_seconds()
                    time.sleep(wait_seconds)
                    logging.info(f"waiting {wait_seconds} until {target_time}")

                    # Schedule the notification
                    self.master.after(0, self.show_notification)

        # Start the notification thread
        threading.Thread(target=notify, daemon=True).start()


    def show_notification(self):
        logging.debug("Initializing show_notification method")
        """
        Displays a reminder notification to the user.

        This method shows an informational message box reminding the user 
        to update their habits for the day.
        """

        messagebox.showinfo("Reminder", "Don't forget to update your habits for today!")
        logging.info("Reminder: Don't forget to update your habits for today!")

    def save_preferences(self):
        logging.debug("Initializing save_preferences")
        """
        Saves the current window size, position, and column configuration to a configuration file.

        This method retrieves the current dimensions (width and height) and position (x and y coordinates)
        of the main application window and stores these preferences in a 'config.ini' file. Additionally,
        it saves the current configuration (width and order) of the Treeview columns under the 'Columns' section.
        The preferences are saved to maintain the user's preferred window state and column settings for future sessions.
        """

        # Save window size and position
        config['Window'] = {
            'width': self.master.winfo_width(),
            'height': self.master.winfo_height(),
            'x': self.master.winfo_x(),
            'y': self.master.winfo_y()
        }

        # Save column settings
        column_config = {}
        for col in self.habit_tree['columns']:
            width = self.habit_tree.column(col, 'width')
            position = self.habit_tree['displaycolumns'].index(col)
            column_config[f'{col}_width'] = width
            column_config[f'{col}_position'] = position
            logging.debug(f"Saving column: {col}, width: {width}, position: {position}")

        config['Columns'] = column_config

        # Write all settings to config file
        with open('config.ini', 'w') as configfile:
            config.write(configfile)
            logging.info("Updated configfile with window size, position, and column configurations.")

    def load_preferences(self):
        logging.debug("Initializing load_preferences method")
        """
        Loads and applies the user's saved window size, position, and column configuration preferences.

        This method reads the window dimensions (width and height), position (x and y coordinates), and column 
        configurations from the 'config.ini' file, if available, and applies them to the main application window 
        and Treeview widget. This ensures that the application starts with the user's preferred window state 
        and column settings.
        """

        # Load window size and position
        if 'Window' in config:
            width = config.getint('Window', 'width')
            height = config.getint('Window', 'height')
            x = config.getint('Window', 'x')
            y = config.getint('Window', 'y')
            self.master.geometry(f"{width}x{height}+{x}+{y}")
            logging.debug(f"Window loaded with width: {width}, height: {height}, x: {x}, y: {y}")

        # Load column settings
        if 'Columns' in config:
            column_config = config['Columns']
            for col in self.habit_tree['columns']:
                try:
                    width = column_config.getint(f'{col}_width')
                    position = column_config.getint(f'{col}_position')
                    self.habit_tree.column(col, width=width)
                    current_display = list(self.habit_tree['displaycolumns'])
                    current_display.remove(col)
                    current_display.insert(position, col)
                    self.habit_tree['displaycolumns'] = tuple(current_display)
                    logging.debug(f"Loaded column: {col}, width: {width}, position: {position}")
                except Exception as e:
                    logging.error(f"Error loading column configuration for {col}: {e}")

    def on_closing(self):
        logging.debug("Initializing on_closing method")
        """
        Handles the application's close event.

        This method is called when the user attempts to close the application window.
        It saves the current window preferences (size, position) and column configurations 
        by calling the `save_preferences` method and then properly closes the main application window.
        """

        self.save_preferences()
        logging.info("Preferences Saved!")
        self.master.destroy()


# Initialize and run the application
if __name__ == "__main__":
    root = tk.Tk()
    app = HabitTrackerApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    logging.debug("------------------------------------------------------------")
    logging.debug("Initializing mainloop")
    logging.debug("------------------------------------------------------------")
    root.mainloop()
    # Close the database connection when the application is closed
    conn.close()
    logging.debug("Connection closed")
    logging.debug("------------------------------------------------------------")
    logging.debug("------------------------------------------------------------")
