from sqlalchemy import JSON, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base  # Absolute import for standalone execution

# Association table for many-to-many between habits and goals
from sqlalchemy import Table

habit_goal_table = Table(
    "habit_goals",
    Base.metadata,
    Column("habit_id", ForeignKey("habits.id"), primary_key=True),
    Column("goal_id", ForeignKey("goals.id"), primary_key=True),
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
    goals = relationship("Goal", secondary=habit_goal_table, back_populates="habits")

class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    date = Column(String, nullable=False)  # Stored as ISO format date string
    note = Column(String)

    habit = relationship("Habit", back_populates="completions")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    outcome = Column(String)
    scope = Column(String, nullable=False)  # year, quarter, month
    start_date = Column(String)
    due_date = Column(String)
    status = Column(String, default="active")
    tags = Column(JSON, default=list)

    habits = relationship("Habit", secondary=habit_goal_table, back_populates="goals")


class Reflection(Base):
    __tablename__ = "reflections"

    id = Column(Integer, primary_key=True, index=True)
    reflection_type = Column(String, nullable=False)  # month, quarter, year
    period_label = Column(String, nullable=False)  # e.g., 2025 Q1
    prompts = Column(JSON, default=list)
    responses = Column(JSON, default=list)
    submitted_at = Column(String)
