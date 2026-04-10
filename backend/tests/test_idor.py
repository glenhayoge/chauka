"""IDOR prevention tests: cross-logframe access must be blocked."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logframe import Indicator, Logframe, Result
from app.models.org import Program, Project, ProjectRole, ProjectRoleType
from tests.conftest import auth_headers


@pytest.fixture
async def two_logframes(db_session: AsyncSession, seed_logframe):
    """Extend seed_logframe with a second logframe (B) containing its own result."""
    s = seed_logframe

    # Second project + logframe under the same org/program
    project_b = Project(id=2, name="Project B", program_id=s["program"].id, organisation_id=s["org"].id)
    db_session.add(project_b)
    await db_session.flush()

    db_session.add(ProjectRole(user_id=s["editor"].id, project_id=project_b.id, role=ProjectRoleType.lead))

    logframe_b = Logframe(id=2, name="Logframe B", project_id=project_b.id)
    db_session.add(logframe_b)
    await db_session.flush()

    result_b = Result(id=100, name="Impact B", logframe_id=logframe_b.id, order=0, level=1)
    db_session.add(result_b)

    indicator_a = Indicator(id=1, name="Indicator A", result_id=s["result"].id, order=0)
    db_session.add(indicator_a)
    await db_session.commit()

    await db_session.refresh(logframe_b)

    return {
        **s,
        "logframe_b": logframe_b,
        "result_b": result_b,
        "indicator_a": indicator_a,
    }


async def test_result_from_a_via_b_returns_404(client: AsyncClient, two_logframes):
    """Accessing result from logframe A via logframe B's URL must return 404."""
    t = two_logframes
    url = f"/api/logframes/{t['logframe_b'].public_id}/results/{t['result'].id}"
    resp = await client.get(url, headers=auth_headers(t["editor"]))
    assert resp.status_code == 404


async def test_result_from_b_via_a_returns_404(client: AsyncClient, two_logframes):
    """Accessing result from logframe B via logframe A's URL must return 404."""
    t = two_logframes
    url = f"/api/logframes/{t['logframe'].public_id}/results/{t['result_b'].id}"
    resp = await client.get(url, headers=auth_headers(t["editor"]))
    assert resp.status_code == 404


async def test_indicator_cross_logframe_returns_404(client: AsyncClient, two_logframes):
    """Accessing indicator from logframe A's result via logframe B's URL must return 404."""
    t = two_logframes
    # indicator_a belongs to result in logframe A, try accessing via logframe B + result_b
    url = f"/api/logframes/{t['logframe_b'].public_id}/results/{t['result_b'].id}/indicators/{t['indicator_a'].id}"
    resp = await client.get(url, headers=auth_headers(t["editor"]))
    assert resp.status_code == 404


async def test_create_indicator_cross_logframe_returns_404(client: AsyncClient, two_logframes):
    """Creating indicator under wrong logframe/result combo must return 404."""
    t = two_logframes
    # Try to create indicator under logframe B but using result from logframe A
    url = f"/api/logframes/{t['logframe_b'].public_id}/results/{t['result'].id}/indicators/"
    resp = await client.post(
        url,
        json={"name": "Cross-logframe indicator", "result_id": t['result'].id},
        headers=auth_headers(t["editor"]),
    )
    assert resp.status_code == 404


async def test_create_activity_cross_logframe_returns_404(client: AsyncClient, two_logframes):
    """Creating activity under wrong logframe/result combo must return 404."""
    t = two_logframes
    url = f"/api/logframes/{t['logframe_b'].public_id}/results/{t['result'].id}/activities/"
    resp = await client.post(
        url,
        json={"name": "Cross-logframe activity"},
        headers=auth_headers(t["editor"]),
    )
    assert resp.status_code == 404
