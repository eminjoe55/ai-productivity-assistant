import json
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.meeting import MeetingSummary
from app.schemas.meeting import SummarizeRequest, SummarizeResponse
from app.services import ai_service

router = APIRouter(tags=["meeting"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(payload: SummarizeRequest, db: AsyncSession = Depends(get_db)):
    result = await ai_service.summarize_meeting(payload.notes)

    executive_summary = result.get("executive_summary", "")
    structured = {
        "discussion_points": result.get("discussion_points", []),
        "decisions_made": result.get("decisions_made", []),
        "risks": result.get("risks", []),
        "next_steps": result.get("next_steps", []),
    }
    action_items = result.get("action_items", [])

    record = MeetingSummary(
        title=payload.title,
        original_notes=payload.notes,
        summary=json.dumps({"executive_summary": executive_summary, **structured}),
        action_items=json.dumps(action_items),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/summarize/history", response_model=list[SummarizeResponse])
async def summary_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MeetingSummary).order_by(MeetingSummary.created_at.desc()).limit(50))
    return result.scalars().all()
