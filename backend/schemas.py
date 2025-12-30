import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HabitBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)

    @field_validator("name", "category")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, value: List[str]) -> List[str]:
        return [t.strip() for t in value if t.strip()]


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    category: Optional[str] = Field(default=None, min_length=1)
    tags: Optional[List[str]] = None

    @field_validator("name", "category")
    @classmethod
    def not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return value
        return [t.strip() for t in value if t.strip()]


class CompletionBase(BaseModel):
    note: Optional[str] = None


class CompletionCreate(CompletionBase):
    date: Optional[datetime.date] = None


class CompletionRead(CompletionBase):
    id: int
    habit_id: int
    date: datetime.date

    model_config = ConfigDict(from_attributes=True)


class HabitRead(HabitBase):
    id: int
    streak: int
    last_completed: Optional[datetime.date] = None
    completions: List[CompletionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
