import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

# Restore marker for pytest-asyncio plugin
@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
