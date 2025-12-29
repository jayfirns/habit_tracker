from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base  # Absolute import for standalone execution

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    streak = Column(Integer, default=0)
    last_completed = Column(String)  # Stored as ISO format date string

    completions = relationship(
        "Completion",
        back_populates="habit",
        cascade="all, delete-orphan",
        order_by="Completion.date",
    )

class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    date = Column(String, nullable=False)  # Stored as ISO format date string
    note = Column(String)

    habit = relationship("Habit", back_populates="completions")
