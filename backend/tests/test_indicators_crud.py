"""CRUD and permission tests for the indicators endpoint."""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers


def _url(seed, indicator_id=None):
    base = f"/api/logframes/{seed['logframe'].public_id}/results/{seed['result'].id}/indicators"
    if indicator_id:
        return f"{base}/{indicator_id}"
    return f"{base}/"


async def test_list_indicators(client: AsyncClient, seed_logframe):
    resp = await client.get(_url(seed_logframe), headers=auth_headers(seed_logframe["editor"]))
    assert resp.status_code == 200


async def test_create_indicator_as_editor(client: AsyncClient, seed_logframe):
    resp = await client.post(
        _url(seed_logframe),
        json={"name": "People trained", "description": "", "result_id": seed_logframe["result"].id},
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "People trained"


async def test_create_indicator_as_viewer_forbidden(client: AsyncClient, seed_logframe):
    resp = await client.post(
        _url(seed_logframe),
        json={"name": "Should Fail", "result_id": seed_logframe["result"].id},
        headers=auth_headers(seed_logframe["viewer"]),
    )
    assert resp.status_code == 403


async def test_update_indicator_as_editor(client: AsyncClient, seed_logframe):
    # Create first
    create_resp = await client.post(
        _url(seed_logframe),
        json={"name": "Original", "result_id": seed_logframe["result"].id},
        headers=auth_headers(seed_logframe["editor"]),
    )
    ind_id = create_resp.json()["id"]

    resp = await client.patch(
        _url(seed_logframe, ind_id),
        json={"name": "Updated"},
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


async def test_delete_indicator_as_editor(client: AsyncClient, seed_logframe):
    create_resp = await client.post(
        _url(seed_logframe),
        json={"name": "To Delete", "result_id": seed_logframe["result"].id},
        headers=auth_headers(seed_logframe["editor"]),
    )
    ind_id = create_resp.json()["id"]

    resp = await client.delete(
        _url(seed_logframe, ind_id),
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 204


async def test_get_nonexistent_indicator(client: AsyncClient, seed_logframe):
    resp = await client.get(
        _url(seed_logframe, 9999),
        headers=auth_headers(seed_logframe["editor"]),
    )
    assert resp.status_code == 404
