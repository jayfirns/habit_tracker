import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HabitBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)
    milestone_ids: List[int] = Field(default_factory=list)

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


class HabitTimeLogBase(BaseModel):
    log_date: datetime.date
    minutes: int = Field(..., ge=0)
    source: str


class HabitTimeLogCreate(HabitTimeLogBase):
    pass


class HabitTimeLogRead(HabitTimeLogBase):
    id: int
    habit_id: int

    model_config = ConfigDict(from_attributes=True)


class HabitTimerStart(BaseModel):
    started_at_ms: int


class HabitTimerRead(HabitTimerStart):
    id: int
    habit_id: int

    model_config = ConfigDict(from_attributes=True)


class HabitRead(HabitBase):
    id: int
    streak: int
    last_completed: Optional[datetime.date] = None
    completions: List[CompletionRead] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    outcome: Optional[str] = None
    scope: str = Field(..., pattern="^(year|quarter|month)$")
    start_date: Optional[datetime.date] = None
    due_date: Optional[datetime.date] = None
    tags: List[str] = Field(default_factory=list)
    habit_ids: List[int] = Field(default_factory=list)
    status: str = Field(default="active")


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    outcome: Optional[str] = None
    scope: Optional[str] = Field(default=None, pattern="^(year|quarter|month)$")
    start_date: Optional[datetime.date] = None
    due_date: Optional[datetime.date] = None
    tags: Optional[List[str]] = None
    habit_ids: Optional[List[int]] = None
    status: Optional[str] = None


class MilestoneRead(MilestoneBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ReflectionBase(BaseModel):
    reflection_type: str = Field(..., pattern="^(month|quarter|year)$")
    period_label: str
    prompts: List[str] = Field(default_factory=list)
    responses: List[str] = Field(default_factory=list)
    submitted_at: Optional[datetime.datetime] = None
    milestone_id: Optional[int] = None
    rating: Optional[str] = None


class ReflectionCreate(ReflectionBase):
    pass


class ReflectionRead(ReflectionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class WorkdayStateBase(BaseModel):
    workday_date: Optional[datetime.date] = None
    planned_start: str = Field(default="09:00")
    planned_minutes: Optional[int] = None
    clock_in_at: Optional[str] = None
    clock_out_at: Optional[str] = None
    worked_minutes_override: Optional[int] = None


class WorkdayStateUpdate(WorkdayStateBase):
    pass


class WorkdayStateRead(WorkdayStateBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
