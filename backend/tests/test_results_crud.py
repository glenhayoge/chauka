"""CRUD and permission tests for the results endpoint."""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers


async def test_list_results(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/"
    resp = await client.get(url, headers=auth_headers(s["editor"]))
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_list_results_as_viewer(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/"
    resp = await client.get(url, headers=auth_headers(s["viewer"]))
    assert resp.status_code == 200


async def test_create_result_as_editor(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/"
    resp = await client.post(
        url,
        json={"name": "New Outcome", "parent_id": s["result"].id},
        headers=auth_headers(s["editor"]),
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "New Outcome"


async def test_create_result_as_viewer_forbidden(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/"
    resp = await client.post(
        url,
        json={"name": "Should Fail"},
        headers=auth_headers(s["viewer"]),
    )
    assert resp.status_code == 403


async def test_create_result_as_outsider_forbidden(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/"
    resp = await client.post(
        url,
        json={"name": "Should Fail"},
        headers=auth_headers(s["outsider"]),
    )
    assert resp.status_code == 403


async def test_get_result(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/{s['result'].id}"
    resp = await client.get(url, headers=auth_headers(s["editor"]))
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Impact"


async def test_get_nonexistent_result(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/9999"
    resp = await client.get(url, headers=auth_headers(s["editor"]))
    assert resp.status_code == 404


async def test_update_result_as_editor(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/{s['result'].id}"
    resp = await client.patch(
        url,
        json={"name": "Updated Impact"},
        headers=auth_headers(s["editor"]),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Impact"


async def test_update_result_as_viewer_forbidden(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/{s['result'].id}"
    resp = await client.patch(
        url,
        json={"name": "Should Fail"},
        headers=auth_headers(s["viewer"]),
    )
    assert resp.status_code == 403


async def test_delete_result_as_editor(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/{s['result'].id}"
    resp = await client.delete(url, headers=auth_headers(s["editor"]))
    assert resp.status_code == 204


async def test_delete_result_as_viewer_forbidden(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/{s['result'].id}"
    resp = await client.delete(url, headers=auth_headers(s["viewer"]))
    assert resp.status_code == 403


async def test_unauthenticated_access_denied(client: AsyncClient, seed_logframe):
    s = seed_logframe
    url = f"/api/logframes/{s['logframe'].public_id}/results/"
    resp = await client.get(url)
    assert resp.status_code == 401
