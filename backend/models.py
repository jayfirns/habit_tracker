from sqlalchemy import JSON, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base  # Absolute import for standalone execution

# Association table for many-to-many between habits and milestones
from sqlalchemy import Table

habit_milestone_table = Table(
    "habit_milestones",
    Base.metadata,
    Column("habit_id", ForeignKey("habits.id"), primary_key=True),
    Column("milestone_id", ForeignKey("milestones.id"), primary_key=True),
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
    milestones = relationship("Milestone", secondary=habit_milestone_table, back_populates="habits")

class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    date = Column(String, nullable=False)  # Stored as ISO format date string
    note = Column(String)

    habit = relationship("Habit", back_populates="completions")

class HabitTimeLog(Base):
    __tablename__ = "habit_time_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    log_date = Column(Date, nullable=False)
    minutes = Column(Integer, nullable=False)
    source = Column(String, nullable=False)

    habit = relationship("Habit", back_populates="time_logs")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    outcome = Column(String)
    scope = Column(String, nullable=False)  # year, quarter, month
    start_date = Column(String)
    due_date = Column(String)
    status = Column(String, default="active")
    tags = Column(JSON, default=list)

    habits = relationship("Habit", secondary=habit_milestone_table, back_populates="milestones")

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
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=True)
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
