"""Tests for TALine model, schemas, and bootstrap integration."""

from datetime import date

import pytest

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models.contacts import User
from app.models.logframe import Activity, Logframe, Result, TALine
from app.schemas.logframe import TALineCreate, TALineRead, TALineUpdate
from app.services.bootstrap import get_bootstrap_data


# --- Schema tests ---


class TestTALineSchemas:
    def test_create_full(self):
        data = TALineCreate(
            activity_id=1, type="Consultant", name="Jane Doe",
            band="High", start_date=date(2026, 4, 1),
            end_date=date(2026, 6, 30), no_days=60, amount=30000.0,
        )
        assert data.activity_id == 1
        assert data.band == "High"
        assert data.start_date == date(2026, 4, 1)

    def test_create_defaults(self):
        data = TALineCreate(activity_id=1)
        assert data.type == ""
        assert data.name == ""
        assert data.band == ""
        assert data.start_date is None
        assert data.end_date is None
        assert data.no_days == 0
        assert data.amount == 0.0

    def test_update_partial(self):
        data = TALineUpdate(band="Medium", no_days=30)
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {"band": "Medium", "no_days": 30}
        assert "name" not in dumped

    def test_update_empty(self):
        data = TALineUpdate()
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {}

    def test_read_from_attributes(self):
        data = TALineRead(
            id=1, activity_id=1, type="Analyst", name="John",
            band="Low", start_date=date(2026, 1, 1),
            end_date=date(2026, 3, 31), no_days=45, amount=15000.0,
        )
        assert data.id == 1
        assert data.amount == 15000.0

    def test_update_dates(self):
        data = TALineUpdate(
            start_date=date(2026, 5, 1),
            end_date=date(2026, 7, 31),
        )
        dumped = data.model_dump(exclude_unset=True)
        assert dumped["start_date"] == date(2026, 5, 1)
        assert dumped["end_date"] == date(2026, 7, 31)


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
    """Seed logframe with activity and TA line."""
    user = User(
        id=1, username="testuser", password="hashed",
        is_staff=True, is_active=True,
    )
    logframe = Logframe(id=1, name="Test Logframe")
    result = Result(id=1, name="Goal", logframe_id=1, order=0, level=1)
    activity = Activity(id=1, name="Activity 1", result_id=1, order=0)
    ta_line = TALine(
        id=1, activity_id=1, type="Consultant", name="Jane Doe",
        band="High", start_date=date(2026, 4, 1),
        end_date=date(2026, 6, 30), no_days=60, amount=30000.0,
    )

    db_session.add_all([user, logframe, result, activity, ta_line])
    await db_session.commit()
    return {
        "user": user, "logframe": logframe, "result": result,
        "activity": activity, "ta_line": ta_line,
    }


async def test_taline_model_persists(db_session: AsyncSession, seed_data):
    """Verify TA line fields are persisted correctly."""
    result = await db_session.execute(select(TALine).where(TALine.id == 1))
    ta = result.scalar_one()
    assert ta.activity_id == 1
    assert ta.type == "Consultant"
    assert ta.name == "Jane Doe"
    assert ta.band == "High"
    assert ta.start_date == date(2026, 4, 1)
    assert ta.end_date == date(2026, 6, 30)
    assert ta.no_days == 60
    assert ta.amount == 30000.0


async def test_taline_nullable_dates(db_session: AsyncSession, seed_data):
    """Verify TA line can have null dates."""
    ta = TALine(id=2, activity_id=1, name="No dates", no_days=10, amount=5000.0)
    db_session.add(ta)
    await db_session.commit()

    result = await db_session.execute(select(TALine).where(TALine.id == 2))
    obj = result.scalar_one()
    assert obj.start_date is None
    assert obj.end_date is None


async def test_taline_relationship(db_session: AsyncSession, seed_data):
    """Verify TA line activity relationship loads correctly."""
    result = await db_session.execute(select(TALine).where(TALine.id == 1))
    ta = result.scalar_one()
    await db_session.refresh(ta, ["activity"])
    assert ta.activity.name == "Activity 1"


async def test_activity_ta_lines_relationship(db_session: AsyncSession, seed_data):
    """Verify activity.ta_lines reverse relationship works."""
    result = await db_session.execute(select(Activity).where(Activity.id == 1))
    activity = result.scalar_one()
    await db_session.refresh(activity, ["ta_lines"])
    assert len(activity.ta_lines) == 1
    assert activity.ta_lines[0].name == "Jane Doe"


async def test_bootstrap_includes_ta_lines(db_session: AsyncSession, seed_data):
    """Verify bootstrap response includes taLines."""
    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert data is not None
    assert "taLines" in data
    assert len(data["taLines"]) == 1
    assert data["taLines"][0]["name"] == "Jane Doe"
    assert data["taLines"][0]["band"] == "High"
    assert data["taLines"][0]["amount"] == 30000.0


async def test_bootstrap_no_ta_lines(db_session: AsyncSession):
    """Verify bootstrap works when no TA lines exist."""
    user = User(id=1, username="u", password="p", is_staff=True, is_active=True)
    logframe = Logframe(id=1, name="LF")
    db_session.add_all([user, logframe])
    await db_session.commit()

    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)
    assert data is not None
    assert data["taLines"] == []


async def test_multiple_ta_lines_per_activity(db_session: AsyncSession, seed_data):
    """Verify multiple TA lines for same activity."""
    ta2 = TALine(
        id=2, activity_id=1, type="Analyst", name="John Smith",
        band="Low", no_days=20, amount=8000.0,
    )
    db_session.add(ta2)
    await db_session.commit()

    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert len(data["taLines"]) == 2
    names = {t["name"] for t in data["taLines"]}
    assert names == {"Jane Doe", "John Smith"}


async def test_ta_lines_filtered_by_logframe(db_session: AsyncSession, seed_data):
    """Verify bootstrap only returns TA lines for activities in the logframe."""
    logframe2 = Logframe(id=2, name="Other LF")
    result2 = Result(id=2, name="Other Goal", logframe_id=2, order=0, level=1)
    activity2 = Activity(id=2, name="Other Activity", result_id=2, order=0)
    ta_other = TALine(
        id=3, activity_id=2, type="Other", name="Other Person",
        band="Medium", no_days=10, amount=5000.0,
    )
    db_session.add_all([logframe2, result2, activity2, ta_other])
    await db_session.commit()

    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert len(data["taLines"]) == 1
    assert data["taLines"][0]["name"] == "Jane Doe"
