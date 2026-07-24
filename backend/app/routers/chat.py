from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.task import Task
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.meeting import ChatRequest
from app.services import ai_service
from app.services.prompts import CHAT_SYSTEM

router = APIRouter(tags=["chat"])


#@router.post("/chat")
#async def chat(payload: ChatRequest):
@router.post("/chat")
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Server-Sent Events endpoint. Frontend consumes this with EventSource-style
    incremental reads (see frontend/src/lib/api.ts streamChat)."""
# Fetch tasks from the database
    result = await db.execute(select(Task))
    tasks = result.scalars().all()

    # Build task context
    task_context = "Current Tasks:\n"

    for task in tasks:
        task_context += (
            f"- {task.title} "
            f"(Status: {task.status}, "
            f"Priority: {task.priority}, "
            f"Deadline: {task.deadline})\n"
        )
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    system_prompt = CHAT_SYSTEM + "\n\n" + task_context

    async def event_stream():
        try:
            async for delta in ai_service.stream_chat(messages, system_prompt):
                yield f"data: {json.dumps({'delta': delta})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
