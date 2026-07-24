"""
Central AI service. All LLM calls go through here so prompt templates stay
separate from route/business logic, per PRD section 12.
"""
import json
from typing import AsyncGenerator

#from anthropic import AsyncAnthropic
import json
from google import genai

from app.core.config import get_settings
from app.services import prompts

settings = get_settings()

client = genai.Client(api_key=settings.GEMINI_API_KEY)
from app.core.config import get_settings
from app.services import prompts

settings = get_settings()

#_client: AsyncAnthropic | None = None


'''def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client'''


'''async def complete_json(system: str, user: str, max_tokens: int = 1024) -> dict:
    """Call the model and parse a strict-JSON response."""
    client = get_client()
    response = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(block.text for block in response.content if block.type == "text").strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}'''
async def complete_json(system: str, user: str, max_tokens: int = 1024):

    prompt = f"""
{system}

Return ONLY valid JSON.

{user}
"""

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )

    text = response.text.strip()

    text = (
        text.replace("```json", "")
        .replace("```", "")
        .strip()
    )

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}

'''async def complete_text(system: str, user: str, max_tokens: int = 1024) -> str:
    client = get_client()
    response = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(block.text for block in response.content if block.type == "text").strip()'''
async def complete_text(system: str, user: str, max_tokens: int = 1024):

    prompt = f"""
System:
{system}

User:
{user}
"""

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )

    return response.text.strip()

'''async def stream_chat(messages: list[dict], system: str) -> AsyncGenerator[str, None]:
    """Yield text deltas as they arrive from the model, for SSE relay."""
    client = get_client()
    async with client.messages.stream(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1500,
        system=system,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text'''
async def stream_chat(messages: list[dict], system: str):

    prompt = system + "\n\n"

    for msg in messages:
        prompt += f"{msg['role']}: {msg['content']}\n"

    stream = client.models.generate_content_stream(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )

    for chunk in stream:
        if chunk.text:
            yield chunk.text

# ---- Feature-specific helpers -------------------------------------------------

async def suggest_priority(title: str, description: str) -> dict:
    return await complete_json(
        prompts.PRIORITY_SYSTEM,
        prompts.priority_user(title, description),
        max_tokens=300,
    )


async def estimate_time(title: str, description: str) -> dict:
    return await complete_json(
        prompts.ESTIMATE_SYSTEM,
        prompts.estimate_user(title, description),
        max_tokens=300,
    )


async def break_into_subtasks(title: str, description: str) -> dict:
    return await complete_json(
        prompts.SUBTASK_SYSTEM,
        prompts.subtask_user(title, description),
        max_tokens=500,
    )


async def suggest_deadline(title: str, description: str) -> dict:
    return await complete_json(
        prompts.DEADLINE_SYSTEM,
        prompts.deadline_user(title, description),
        max_tokens=300,
    )


async def suggest_focus(tasks: list[dict]) -> dict:
    return await complete_json(
        prompts.FOCUS_SYSTEM,
        prompts.focus_user(tasks),
        max_tokens=400,
    )


async def summarize_meeting(notes: str) -> dict:
    return await complete_json(
        prompts.SUMMARY_SYSTEM,
        prompts.summary_user(notes),
        max_tokens=2000,
    )


async def generate_plan(date: str, working_hours: str, tasks: list[dict], priorities: str, meetings: str) -> dict:
    return await complete_json(
        prompts.PLANNER_SYSTEM,
        prompts.planner_user(date, working_hours, tasks, priorities, meetings),
        max_tokens=2000,
    )
