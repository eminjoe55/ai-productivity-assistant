"""
Basic API tests. Run with: pytest -q
Requires httpx: pip install httpx pytest pytest-asyncio
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_task_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_resp = await client.post(
            "/tasks", json={"title": "Write tests", "description": "Cover core CRUD", "priority": "high"}
        )
        assert create_resp.status_code == 201
        task = create_resp.json()
        task_id = task["id"]

        list_resp = await client.get("/tasks")
        assert list_resp.status_code == 200
        assert any(t["id"] == task_id for t in list_resp.json())

        update_resp = await client.put(f"/tasks/{task_id}", json={"status": "in_progress"})
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "in_progress"

        complete_resp = await client.post(f"/tasks/{task_id}/complete")
        assert complete_resp.status_code == 200
        assert complete_resp.json()["status"] == "done"

        delete_resp = await client.delete(f"/tasks/{task_id}")
        assert delete_resp.status_code == 204


@pytest.mark.asyncio
async def test_task_validation_error():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/tasks", json={})
    assert resp.status_code == 422
