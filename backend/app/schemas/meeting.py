from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SummarizeRequest(BaseModel):
    title: str = "Untitled Meeting"
    notes: str


class SummarizeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    summary: str
    action_items: str
    created_at: datetime


class PlannerRequest(BaseModel):
    date: str
    working_hours: str = "09:00-17:00"
    priorities: str = ""
    meetings: str = ""


class PlannerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    date: str
    working_hours: str
    generated_plan: str
    created_at: datetime


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
