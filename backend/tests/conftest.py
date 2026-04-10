"""Shared test fixtures for Chauka backend tests."""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.utils import create_access_token
from app.database import Base, get_db
from app.main import app
from app.models.contacts import User
from app.models.logframe import Logframe, Result
from app.models.org import (
    Organisation,
    OrganisationMembership,
    OrgRole,
    Program,
    Project,
    ProjectRole,
    ProjectRoleType,
)


@pytest.fixture
async def db_session():
    """Create an in-memory SQLite database with all tables."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession):
    """AsyncClient with get_db overridden to use the test session."""

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


def auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization headers with a JWT for the given user."""
    token = create_access_token({"sub": user.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def seed_logframe(db_session: AsyncSession):
    """Create a full RBAC chain: org → program → project → logframe + users.

    Returns a dict with all objects and convenience keys.
    """
    # Users
    editor = User(
        id=1, username="editor", password="hashed",
        email="editor@test.com", is_staff=False, is_active=True,
    )
    viewer = User(
        id=2, username="viewer", password="hashed",
        email="viewer@test.com", is_staff=False, is_active=True,
    )
    outsider = User(
        id=3, username="outsider", password="hashed",
        email="outsider@test.com", is_staff=False, is_active=True,
    )
    db_session.add_all([editor, viewer, outsider])
    await db_session.flush()

    # Org
    org = Organisation(
        id=1, name="Test Org", slug="test-org",
        owner_id=editor.id,
    )
    db_session.add(org)
    await db_session.flush()

    # Memberships
    db_session.add_all([
        OrganisationMembership(user_id=editor.id, organisation_id=org.id, role=OrgRole.admin),
        OrganisationMembership(user_id=viewer.id, organisation_id=org.id, role=OrgRole.member),
    ])

    # Program → Project
    program = Program(id=1, name="Test Program", organisation_id=org.id)
    db_session.add(program)
    await db_session.flush()

    project = Project(id=1, name="Test Project", program_id=program.id, organisation_id=org.id)
    db_session.add(project)
    await db_session.flush()

    # Project roles
    db_session.add_all([
        ProjectRole(user_id=editor.id, project_id=project.id, role=ProjectRoleType.lead),
        ProjectRole(user_id=viewer.id, project_id=project.id, role=ProjectRoleType.viewer),
    ])

    # Logframe
    logframe = Logframe(id=1, name="Test Logframe", project_id=project.id)
    db_session.add(logframe)
    await db_session.flush()

    # Result
    result = Result(id=1, name="Test Impact", logframe_id=logframe.id, order=0, level=1)
    db_session.add(result)
    await db_session.commit()

    # Refresh to populate public_id
    await db_session.refresh(logframe)
    await db_session.refresh(org)

    return {
        "editor": editor,
        "viewer": viewer,
        "outsider": outsider,
        "org": org,
        "program": program,
        "project": project,
        "logframe": logframe,
        "result": result,
    }
