from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    streak = Column(Integer, default=0)
    last_completed = Column(String) # Stored as ISO format date string

    completions = relationship("Completion", back_populates="habit")

class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"))
    date = Column(String, nullable=False) # Stored as ISO format date string
    note = Column(String)

    habit = relationship("Habit", back_populates="completions")
