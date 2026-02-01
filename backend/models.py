from sqlalchemy import JSON, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base  # Absolute import for standalone execution

# Association table for many-to-many between habits and goals
from sqlalchemy import Table

habit_goal_table = Table(
    "habit_goals",
    Base.metadata,
    Column("habit_id", ForeignKey("habits.id"), primary_key=True),
    Column("goal_id", ForeignKey("smart_goals.id"), primary_key=True),
)

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    streak = Column(Integer, default=0)
    last_completed = Column(String)  # Stored as ISO format date string
    tags = Column(JSON, default=list)

    completions = relationship(
        "Completion",
        back_populates="habit",
        cascade="all, delete-orphan",
        order_by="Completion.date",
    )
    time_logs = relationship(
        "HabitTimeLog",
        back_populates="habit",
        cascade="all, delete-orphan",
    )
    timers = relationship(
        "HabitTimer",
        back_populates="habit",
        cascade="all, delete-orphan",
    )
    goals = relationship("SmartGoal", secondary=habit_goal_table, back_populates="habits")

class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    date = Column(String, nullable=False)  # Stored as ISO format date string
    note = Column(String)
    goal_id = Column(Integer, ForeignKey("smart_goals.id", ondelete="SET NULL"), nullable=True)

    habit = relationship("Habit", back_populates="completions")

class HabitTimeLog(Base):
    __tablename__ = "habit_time_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    log_date = Column(Date, nullable=False)
    minutes = Column(Integer, nullable=False)
    source = Column(String, nullable=False)

    habit = relationship("Habit", back_populates="time_logs")

class HabitTimer(Base):
    __tablename__ = "habit_timers"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), unique=True)
    started_at_ms = Column(Integer, nullable=False)

    habit = relationship("Habit", back_populates="timers")


class SmartGoal(Base):
    __tablename__ = "smart_goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # Specific
    why_this_matters = Column(String)  # Relevant (verbose)
    frequency = Column(Integer, nullable=False)  # Measurable (e.g., 3)
    frequency_period = Column(String, default="week")  # "week" or "month"
    success_threshold = Column(Integer, default=80)  # 0-100 percentage
    quarter = Column(String, nullable=False)  # Time-bound (e.g., "Q1 2026")
    tags = Column(JSON, default=list)
    status = Column(String, default="active")  # active/complete/archived
    created_at = Column(String)

    habits = relationship("Habit", secondary=habit_goal_table, back_populates="goals")

    @property
    def habit_ids(self):
        return [habit.id for habit in self.habits] if self.habits else []


class Reflection(Base):
    __tablename__ = "reflections"

    id = Column(Integer, primary_key=True, index=True)
    reflection_type = Column(String, nullable=False)  # month, quarter, year
    period_label = Column(String, nullable=False)  # e.g., 2025 Q1
    prompts = Column(JSON, default=list)
    responses = Column(JSON, default=list)
    submitted_at = Column(String)
    goal_id = Column(Integer, ForeignKey("smart_goals.id"), nullable=True)
    rating = Column(String)  # on_track, blocked, ahead, complete


class WorkdayState(Base):
    __tablename__ = "workday_states"

    id = Column(Integer, primary_key=True, index=True)
    workday_date = Column(String, nullable=True)
    planned_start = Column(String, default="09:00")
    planned_minutes = Column(Integer, nullable=True)
    clock_in_at = Column(String, nullable=True)
    clock_out_at = Column(String, nullable=True)
    worked_minutes_override = Column(Integer, nullable=True)
