import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/auth/token",
        data={"username": "wrong", "password": "wrong"},
    )
    assert response.status_code == 401


async def test_protected_route_requires_auth(client: AsyncClient):
    response = await client.get("/api/logframes/")
    assert response.status_code == 401
