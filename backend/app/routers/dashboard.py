from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.task import Task
from app.models.meeting import MeetingSummary

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    #now = datetime.now(timezone.utc)
    now = datetime.now()
    
    today_end = now.replace(hour=23, minute=59, second=59)

    all_tasks_result = await db.execute(select(Task))
    all_tasks = all_tasks_result.scalars().all()

    todays = [t for t in all_tasks if t.deadline and t.deadline.date() == now.date() and t.status != "done"]
    pending = [t for t in all_tasks if t.status in ("todo", "in_progress")]
    completed = [t for t in all_tasks if t.status == "done"]
    upcoming = sorted(
        [t for t in all_tasks if t.deadline and t.deadline > now and t.status != "done"],
        key=lambda t: t.deadline,
    )[:5]

    total_relevant = len(pending) + len(completed)
    productivity_score = round((len(completed) / total_relevant) * 100) if total_relevant else 0

    recent_summaries_result = await db.execute(
        select(MeetingSummary).order_by(MeetingSummary.created_at.desc()).limit(3)
    )
    recent_summaries = recent_summaries_result.scalars().all()

    return {
        "welcome_message": "Welcome back! Here's where things stand today.",
        "todays_tasks": [{"id": t.id, "title": t.title, "priority": t.priority} for t in todays],
        "pending_tasks_count": len(pending),
        "completed_tasks_count": len(completed),
        "upcoming_deadlines": [
            {"id": t.id, "title": t.title, "deadline": t.deadline.isoformat() if t.deadline else None}
            for t in upcoming
        ],
        "productivity_score": productivity_score,
        "recent_meeting_summaries": [
            {"id": m.id, "title": m.title, "created_at": m.created_at.isoformat()} for m in recent_summaries
        ],
    }
