"""CRUD and permission tests for the activities endpoint."""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers


def _url(seed, activity_id=None):
    base = f"/api/logframes/{seed['logframe'].public_id}/results/{seed['result'].id}/activities"
    if activity_id:
        return f"{base}/{activity_id}"
    return f"{base}/"


async def test_list_activities(client: AsyncClient, seed_logframe):
    resp = await client.get(_url(seed_logframe), headers=auth_headers(seed_logframe["editor"]))
    assert resp.status_code == 200


async def test_create_activity_as_editor(client: AsyncClient, seed_logframe):
    resp = await client.post(
        _url(seed_logframe),
        json={"name": "Conduct training"},
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Conduct training"


async def test_create_activity_as_viewer_forbidden(client: AsyncClient, seed_logframe):
    resp = await client.post(
        _url(seed_logframe),
        json={"name": "Should Fail"},
        headers=auth_headers(seed_logframe["viewer"]),
    )
    assert resp.status_code == 403


async def test_update_activity_as_editor(client: AsyncClient, seed_logframe):
    create_resp = await client.post(
        _url(seed_logframe),
        json={"name": "Original"},
        headers=auth_headers(seed_logframe["editor"]),
    )
    act_id = create_resp.json()["id"]

    resp = await client.patch(
        _url(seed_logframe, act_id),
        json={"name": "Updated"},
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


async def test_delete_activity_as_editor(client: AsyncClient, seed_logframe):
    create_resp = await client.post(
        _url(seed_logframe),
        json={"name": "To Delete"},
        headers=auth_headers(seed_logframe["editor"]),
    )
    act_id = create_resp.json()["id"]

    resp = await client.delete(
        _url(seed_logframe, act_id),
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 204


async def test_update_nonexistent_activity_404(client: AsyncClient, seed_logframe):
    resp = await client.patch(
        _url(seed_logframe, 9999),
        json={"name": "Ghost"},
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 404
