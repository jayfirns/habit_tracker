"""
habit_tracker

This project was created with ChatGPTo1

Author: John Firnschild
Written: 9/14/2024
Version: 0.1.0

"""


import tkinter as tk
from tkinter import messagebox
import sqlite3
from datetime import date

# Connect to SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect('habit_tracker.db')
cursor = conn.cursor()

# Create tables for habits and completions
cursor.execute('''
    CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
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

class HabitTrackerApp:
    def __init__(self, master):
        self.master = master
        master.title("Habit Tracker")

        self.habit_name_var = tk.StringVar()

        # Create UI elements
        self.create_widgets()
        # Load existing habits
        self.load_habits()

    def create_widgets(self):
        # Input field for new habits
        tk.Label(self.master, text="Habit Name:").grid(row=0, column=0, padx=5, pady=5)
        tk.Entry(self.master, textvariable=self.habit_name_var).grid(row=0, column=1, padx=5, pady=5)
        tk.Button(self.master, text="Add Habit", command=self.add_habit).grid(row=0, column=2, padx=5, pady=5)

        # Listbox to display habits
        self.habit_listbox = tk.Listbox(self.master, selectmode=tk.SINGLE)
        self.habit_listbox.grid(row=1, column=0, columnspan=3, sticky='nsew', padx=5, pady=5)
        self.habit_listbox.bind('<<ListboxSelect>>', self.on_habit_select)

        # Buttons for habit actions
        tk.Button(self.master, text="Mark as Done Today", command=self.mark_done).grid(row=2, column=0, columnspan=3, padx=5, pady=5)
        tk.Button(self.master, text="View Progress", command=self.view_progress).grid(row=3, column=0, columnspan=3, padx=5, pady=5)

        # Configure grid weights for resizing
        self.master.grid_rowconfigure(1, weight=1)
        self.master.grid_columnconfigure(1, weight=1)

    def add_habit(self):
        habit_name = self.habit_name_var.get().strip()
        if habit_name:
            cursor.execute('INSERT INTO habits (name) VALUES (?)', (habit_name,))
            conn.commit()
            self.habit_name_var.set('')
            self.load_habits()
        else:
            messagebox.showwarning("Input Error", "Please enter a habit name.")

    def load_habits(self):
        self.habit_listbox.delete(0, tk.END)
        cursor.execute('SELECT id, name FROM habits')
        self.habits = cursor.fetchall()
        for habit in self.habits:
            self.habit_listbox.insert(tk.END, habit[1])

    def on_habit_select(self, event):
        selection = event.widget.curselection()
        if selection:
            index = selection[0]
            self.selected_habit = self.habits[index]
        else:
            self.selected_habit = None

    def mark_done(self):
        if hasattr(self, 'selected_habit') and self.selected_habit:
            habit_id = self.selected_habit[0]
            today = date.today().isoformat()
            # Check if already marked as done today
            cursor.execute('SELECT * FROM completions WHERE habit_id = ? AND date = ?', (habit_id, today))
            if cursor.fetchone():
                messagebox.showinfo("Already Done", "You have already marked this habit as done today.")
            else:
                cursor.execute('INSERT INTO completions (habit_id, date) VALUES (?, ?)', (habit_id, today))
                conn.commit()
                messagebox.showinfo("Success", "Habit marked as done for today!")
        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")

    def view_progress(self):
        if hasattr(self, 'selected_habit') and self.selected_habit:
            habit_id = self.selected_habit[0]
            cursor.execute('SELECT date FROM completions WHERE habit_id = ?', (habit_id,))
            completions = cursor.fetchall()
            if completions:
                completion_dates = [c[0] for c in completions]
                message = f"Completions for '{self.selected_habit[1]}':\n" + "\n".join(completion_dates)
            else:
                message = f"No completions recorded for '{self.selected_habit[1]}'."
            messagebox.showinfo("Progress", message)
        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")

# Initialize and run the application
if __name__ == "__main__":
    root = tk.Tk()
    app = HabitTrackerApp(root)
    root.mainloop()
    # Close the database connection when the application is closed
    conn.close()
