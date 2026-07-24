import pytest_asyncio
from app.core.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def _init_database():
    await init_db()
    yield
