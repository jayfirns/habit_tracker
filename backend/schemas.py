from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HabitBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)

    @field_validator("name", "category")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    category: Optional[str] = Field(default=None, min_length=1)

    @field_validator("name", "category")
    @classmethod
    def not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class CompletionBase(BaseModel):
    note: Optional[str] = None


class CompletionCreate(CompletionBase):
    date: Optional[date] = None


class CompletionRead(CompletionBase):
    id: int
    habit_id: int
    date: date

    model_config = ConfigDict(from_attributes=True)


class HabitRead(HabitBase):
    id: int
    streak: int
    last_completed: Optional[date] = None
    completions: List[CompletionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
