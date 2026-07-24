import json
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.task import Task
from app.models.meeting import DailyPlan
from app.schemas.meeting import PlannerRequest, PlannerResponse
from app.services import ai_service

router = APIRouter(tags=["planner"])


@router.post("/planner", response_model=PlannerResponse)
async def create_plan(payload: PlannerRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.status.in_(["todo", "in_progress"])))
    tasks = result.scalars().all()
    task_dicts = [
        {"id": t.id, "title": t.title, "priority": t.priority, "deadline": str(t.deadline)}
        for t in tasks
    ]

    plan_result = await ai_service.generate_plan(
        payload.date, payload.working_hours, task_dicts, payload.priorities, payload.meetings
    )

    record = DailyPlan(
        date=payload.date,
        working_hours=payload.working_hours,
        generated_plan=json.dumps(plan_result),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/planner/history", response_model=list[PlannerResponse])
async def plan_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DailyPlan).order_by(DailyPlan.created_at.desc()).limit(30))
    return result.scalars().all()
