from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.services import ai_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=201)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(**payload.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|deadline|priority|title)$"),
):
    stmt = select(Task)
    if status:
        stmt = stmt.where(Task.status == status)
    if priority:
        stmt = stmt.where(Task.priority == priority)
    if category:
        stmt = stmt.where(Task.category == category)
    if search:
        stmt = stmt.where(Task.title.ilike(f"%{search}%"))
    stmt = stmt.order_by(getattr(Task, sort_by).desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, payload: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    await db.delete(task)
    await db.commit()


@router.post("/{task_id}/complete", response_model=TaskOut)
async def complete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    task.status = "done"
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/{task_id}/archive", response_model=TaskOut)
async def archive_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    task.status = "archived"
    await db.commit()
    await db.refresh(task)
    return task


# ---- AI-assisted features (PRD Module 2 "AI Features") -----------------------

@router.post("/{task_id}/ai/suggest-priority")
async def ai_suggest_priority(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return await ai_service.suggest_priority(task.title, task.description)


@router.post("/{task_id}/ai/estimate-time")
async def ai_estimate_time(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return await ai_service.estimate_time(task.title, task.description)


@router.post("/{task_id}/ai/subtasks")
async def ai_subtasks(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return await ai_service.break_into_subtasks(task.title, task.description)


@router.post("/{task_id}/ai/suggest-deadline")
async def ai_suggest_deadline(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return await ai_service.suggest_deadline(task.title, task.description)


@router.get("/ai/suggest-focus")
async def ai_suggest_focus(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.status.in_(["todo", "in_progress"])))
    tasks = result.scalars().all()
    if not tasks:
        return {"task_id": None, "title": None, "reasoning": "No open tasks — you're all caught up."}
    task_dicts = [
        {"id": t.id, "title": t.title, "priority": t.priority, "deadline": str(t.deadline), "status": t.status}
        for t in tasks
    ]
    return await ai_service.suggest_focus(task_dicts)
