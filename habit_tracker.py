"""
habit_tracker

This project was created with ChatGPTo1

Author: John Firnschild
Written: 9/14/2024
Version: 0.2.1

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

# Install required packages:
# pip install tkcalendar matplotlib

# Connect to SQLite database (or create it if it doesn't exist)
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
        self.master = master
        master.title("My Personal Habit Tracker")
        # Set window icon if desired
        # master.iconbitmap('path_to_icon.ico')

        self.habit_name_var = tk.StringVar()
        self.category_var = tk.StringVar()
        self.selected_habit = None

        # Load user preferences
        self.load_preferences()

        # Create UI elements
        self.create_widgets()
        # Load existing habits
        self.load_habits()
        # Schedule notifications
        self.schedule_notifications()

    def create_widgets(self):
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

        columns = ('Name', 'Category', 'Streak')
        self.habit_tree = ttk.Treeview(list_frame, columns=columns, show='headings')
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

        # Progress bars frame
        self.progress_frame = ttk.Frame(self.master)
        self.progress_frame.grid(row=3, column=0, padx=10, pady=10, sticky='ew')

    def add_habit(self):
        habit_name = self.habit_name_var.get().strip()
        category = self.category_var.get().strip()
        if habit_name and category:
            cursor.execute('INSERT INTO habits (name, category) VALUES (?, ?)', (habit_name, category))
            conn.commit()
            self.habit_name_var.set('')
            self.category_var.set('')
            self.load_habits()
        else:
            messagebox.showwarning("Input Error", "Please enter both habit name and category.")

    def load_habits(self):
        # Clear the treeview
        for item in self.habit_tree.get_children():
            self.habit_tree.delete(item)
        cursor.execute('SELECT id, name, category, streak FROM habits ORDER BY category, name')
        self.habits = cursor.fetchall()
        for habit in self.habits:
            self.habit_tree.insert('', tk.END, values=(habit[1], habit[2], f"{habit[3]} days"))
        self.update_progress_bars()

    def on_habit_select(self, event):
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
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            today = date.today()
            today_str = today.isoformat()

            # Insert completion record, allowing multiple entries per day
            cursor.execute('INSERT INTO completions (habit_id, date) VALUES (?, ?)', (habit_id, today_str))

            # Get the last completed date and current streak from the habits table
            cursor.execute('SELECT last_completed, streak FROM habits WHERE id = ?', (habit_id,))
            result = cursor.fetchone()
            last_completed_str, streak = result
            last_completed = date.fromisoformat(last_completed_str) if last_completed_str else None

            # Update streak only if it hasn't already been updated today
            if last_completed != today:
                if last_completed == today - timedelta(days=1):
                    streak += 1
                else:
                    streak = 1

                # Update habit record with new streak and last completed date
                cursor.execute('UPDATE habits SET streak = ?, last_completed = ? WHERE id = ?', (streak, today_str, habit_id))

            conn.commit()
            self.load_habits()

            messagebox.showinfo("Success", f"Habit marked as done for today! Current streak: {streak} days.")
        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")


    def update_progress_bars(self):
        # Clear existing progress bars
        for widget in self.progress_frame.winfo_children():
            widget.destroy()

        # Fetch completions and calculate progress
        for habit in self.habits:
            habit_id, habit_name, category, streak = habit

            # Calculate total completions
            cursor.execute('SELECT COUNT(*) FROM completions WHERE habit_id = ?', (habit_id,))
            total_completions = cursor.fetchone()[0]

            # For demonstration, set a goal of 30 completions
            goal = 30
            progress = int((total_completions / goal) * 100) if goal else 0
            progress = min(progress, 100)  # Cap at 100%

            # Display habit name and progress bar
            frame = ttk.Frame(self.progress_frame)
            frame.pack(fill='x', pady=2)

            ttk.Label(frame, text=f"{habit_name} ({category})").pack(side='left')
            progress_bar = ttk.Progressbar(frame, length=200, value=progress)
            progress_bar.pack(side='right', padx=10)

    def view_progress(self):
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            habit_name = self.selected_habit[1]

            # Fetch completion dates
            cursor.execute('SELECT date FROM completions WHERE habit_id = ?', (habit_id,))
            completions = cursor.fetchall()
            completion_dates = [date.fromisoformat(c[0]) for c in completions]

            if not completion_dates:
                messagebox.showinfo("Progress", f"No completions recorded for '{habit_name}'.")
                return

            # Create a new window for the calendar
            cal_window = tk.Toplevel(self.master)
            cal_window.title(f"Progress for '{habit_name}'")

            # Create a Calendar widget
            cal = Calendar(cal_window, selectmode='none')
            cal.pack(padx=10, pady=10)

            # Highlight completion dates
            for completion_date in completion_dates:
                cal.calevent_create(completion_date, 'Completed', 'completed')

            # Define a tag style
            cal.tag_config('completed', background='green', foreground='white')

        else:
            messagebox.showwarning("Selection Error", "Please select a habit from the list.")

    def show_chart(self):
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            habit_name = self.selected_habit[1]

            # Fetch completion dates
            cursor.execute('SELECT date FROM completions WHERE habit_id = ?', (habit_id,))
            completions = cursor.fetchall()
            dates = [date.fromisoformat(c[0]) for c in completions]

            if not dates:
                messagebox.showinfo("No Data", f"No completion data to display for '{habit_name}'.")
                return

            # Prepare data for plotting
            dates.sort()
            date_counts = {}
            for d in dates:
                date_counts[d] = date_counts.get(d, 0) + 1

            dates_list = list(date_counts.keys())
            completions_list = [date_counts[d] for d in dates_list]

            # Create a figure
            fig, ax = plt.subplots(figsize=(6, 4))
            ax.plot(dates_list, completions_list, marker='o')
            ax.set_title(f"Completion Trend for '{habit_name}'")
            ax.set_xlabel('Date')
            ax.set_ylabel('Completions')
            ax.grid(True)

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
                self.load_habits()
            else:
                messagebox.showwarning("Input Error", "Please enter both habit name and category.")
        else:
            messagebox.showwarning("Selection Error", "Please select a habit to edit.")

    def delete_habit(self):
        if self.selected_habit:
            habit_id = self.selected_habit[0]
            habit_name = self.selected_habit[1]

            # Confirm deletion
            confirm = messagebox.askyesno("Delete Habit", f"Are you sure you want to delete '{habit_name}'?")
            if confirm:
                cursor.execute('DELETE FROM habits WHERE id = ?', (habit_id,))
                cursor.execute('DELETE FROM completions WHERE habit_id = ?', (habit_id,))
                conn.commit()
                self.load_habits()
        else:
            messagebox.showwarning("Selection Error", "Please select a habit to delete.")

    def schedule_notifications(self):
        # Schedule a notification every day at a specific time
        def notify():
            while True:
                now = datetime.now()
                target_time = now.replace(hour=20, minute=0, second=0, microsecond=0)  # 8 PM
                if now >= target_time:
                    target_time += timedelta(days=1)
                wait_seconds = (target_time - now).total_seconds()
                time.sleep(wait_seconds)
                self.master.after(0, self.show_notification)

        threading.Thread(target=notify, daemon=True).start()

    def show_notification(self):
        messagebox.showinfo("Reminder", "Don't forget to update your habits for today!")

    def save_preferences(self):
        config['Window'] = {
            'width': self.master.winfo_width(),
            'height': self.master.winfo_height(),
            'x': self.master.winfo_x(),
            'y': self.master.winfo_y()
        }
        with open('config.ini', 'w') as configfile:
            config.write(configfile)

    def load_preferences(self):
        if 'Window' in config:
            width = config.getint('Window', 'width')
            height = config.getint('Window', 'height')
            x = config.getint('Window', 'x')
            y = config.getint('Window', 'y')
            self.master.geometry(f"{width}x{height}+{x}+{y}")

    def on_closing(self):
        self.save_preferences()
        self.master.destroy()

# Initialize and run the application
if __name__ == "__main__":
    root = tk.Tk()
    app = HabitTrackerApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()
    # Close the database connection when the application is closed
    conn.close()
