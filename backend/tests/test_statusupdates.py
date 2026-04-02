"""Tests for StatusUpdate model, schemas, and bootstrap integration."""

from datetime import date

import pytest

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models.contacts import User
from app.models.logframe import Activity, Logframe, Result, StatusCode, StatusUpdate
from app.schemas.logframe import StatusUpdateCreate, StatusUpdateRead, StatusUpdateUpdate
from app.services.bootstrap import get_bootstrap_data


# --- Schema tests ---


class TestStatusUpdateSchemas:
    def test_create_full(self):
        data = StatusUpdateCreate(
            activity_id=1, code_id=2, date=date(2026, 3, 28),
            description="On track",
        )
        assert data.activity_id == 1
        assert data.code_id == 2
        assert data.date == date(2026, 3, 28)
        assert data.description == "On track"

    def test_create_defaults(self):
        data = StatusUpdateCreate(activity_id=1, date=date(2026, 3, 28))
        assert data.code_id is None
        assert data.description == ""

    def test_update_partial(self):
        data = StatusUpdateUpdate(description="Delayed")
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {"description": "Delayed"}
        assert "date" not in dumped

    def test_update_empty(self):
        data = StatusUpdateUpdate()
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {}

    def test_read_from_attributes(self):
        data = StatusUpdateRead(
            id=1, activity_id=1, user_id=1, code_id=2,
            date=date(2026, 3, 28), description="On track",
        )
        assert data.id == 1
        assert data.user_id == 1

    def test_update_date(self):
        data = StatusUpdateUpdate(date=date(2026, 4, 1))
        dumped = data.model_dump(exclude_unset=True)
        assert dumped["date"] == date(2026, 4, 1)


# --- Model and bootstrap integration tests ---


@pytest.fixture
async def db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
async def seed_data(db_session: AsyncSession):
    """Seed logframe with activity and status update."""
    user = User(
        id=1, username="testuser", password="hashed",
        is_staff=True, is_active=True,
    )
    logframe = Logframe(id=1, name="Test Logframe")
    result = Result(id=1, name="Goal", logframe_id=1, order=0, level=1)
    activity = Activity(id=1, name="Activity 1", result_id=1, order=0)
    status_code = StatusCode(id=1, name="On Track", logframe_id=1)
    status_update = StatusUpdate(
        id=1, activity_id=1, user_id=1, code_id=1,
        date=date(2026, 3, 28), description="Everything on schedule",
    )

    db_session.add_all([user, logframe, result, activity, status_code, status_update])
    await db_session.commit()
    return {
        "user": user, "logframe": logframe, "result": result,
        "activity": activity, "status_code": status_code,
        "status_update": status_update,
    }


async def test_statusupdate_model_persists(db_session: AsyncSession, seed_data):
    """Verify status update fields are persisted correctly."""
    result = await db_session.execute(select(StatusUpdate).where(StatusUpdate.id == 1))
    su = result.scalar_one()
    assert su.activity_id == 1
    assert su.user_id == 1
    assert su.code_id == 1
    assert su.date == date(2026, 3, 28)
    assert su.description == "Everything on schedule"


async def test_statusupdate_nullable_code(db_session: AsyncSession, seed_data):
    """Verify status update can have null code_id."""
    su = StatusUpdate(
        id=2, activity_id=1, user_id=1, code_id=None,
        date=date(2026, 3, 29), description="No code",
    )
    db_session.add(su)
    await db_session.commit()

    result = await db_session.execute(select(StatusUpdate).where(StatusUpdate.id == 2))
    obj = result.scalar_one()
    assert obj.code_id is None


async def test_statusupdate_activity_relationship(db_session: AsyncSession, seed_data):
    """Verify status update activity relationship loads correctly."""
    result = await db_session.execute(select(StatusUpdate).where(StatusUpdate.id == 1))
    su = result.scalar_one()
    await db_session.refresh(su, ["activity"])
    assert su.activity.name == "Activity 1"


async def test_activity_status_updates_relationship(db_session: AsyncSession, seed_data):
    """Verify activity.status_updates reverse relationship works."""
    result = await db_session.execute(select(Activity).where(Activity.id == 1))
    activity = result.scalar_one()
    await db_session.refresh(activity, ["status_updates"])
    assert len(activity.status_updates) == 1
    assert activity.status_updates[0].description == "Everything on schedule"


async def test_statusupdate_code_relationship(db_session: AsyncSession, seed_data):
    """Verify status update code relationship loads correctly."""
    result = await db_session.execute(select(StatusUpdate).where(StatusUpdate.id == 1))
    su = result.scalar_one()
    await db_session.refresh(su, ["code"])
    assert su.code.name == "On Track"


async def test_bootstrap_includes_status_updates(db_session: AsyncSession, seed_data):
    """Verify bootstrap response includes statusUpdates."""
    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert data is not None
    assert "statusUpdates" in data
    assert len(data["statusUpdates"]) == 1
    assert data["statusUpdates"][0]["description"] == "Everything on schedule"
    assert data["statusUpdates"][0]["user_id"] == 1
    assert data["statusUpdates"][0]["code_id"] == 1


async def test_bootstrap_no_status_updates(db_session: AsyncSession):
    """Verify bootstrap works when no status updates exist."""
    user = User(id=1, username="u", password="p", is_staff=True, is_active=True)
    logframe = Logframe(id=1, name="LF")
    db_session.add_all([user, logframe])
    await db_session.commit()

    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)
    assert data is not None
    assert data["statusUpdates"] == []


async def test_multiple_status_updates_per_activity(db_session: AsyncSession, seed_data):
    """Verify multiple status updates for same activity."""
    su2 = StatusUpdate(
        id=2, activity_id=1, user_id=1, code_id=1,
        date=date(2026, 4, 1), description="Still on track",
    )
    db_session.add(su2)
    await db_session.commit()

    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert len(data["statusUpdates"]) == 2
    descriptions = {su["description"] for su in data["statusUpdates"]}
    assert descriptions == {"Everything on schedule", "Still on track"}


async def test_status_updates_filtered_by_logframe(db_session: AsyncSession, seed_data):
    """Verify bootstrap only returns status updates for activities in the logframe."""
    logframe2 = Logframe(id=2, name="Other LF")
    result2 = Result(id=2, name="Other Goal", logframe_id=2, order=0, level=1)
    activity2 = Activity(id=2, name="Other Activity", result_id=2, order=0)
    su_other = StatusUpdate(
        id=3, activity_id=2, user_id=1, code_id=None,
        date=date(2026, 3, 30), description="Other update",
    )
    db_session.add_all([logframe2, result2, activity2, su_other])
    await db_session.commit()

    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert len(data["statusUpdates"]) == 1
    assert data["statusUpdates"][0]["description"] == "Everything on schedule"
