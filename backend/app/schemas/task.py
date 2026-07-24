from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    category: str = "general"
    deadline: Optional[datetime] = None
    status: str = "todo"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime


class SubtaskSuggestion(BaseModel):
    subtasks: list[str]


class PrioritySuggestion(BaseModel):
    priority: str
    reasoning: str


class FocusSuggestion(BaseModel):
    task_id: str
    title: str
    reasoning: str
