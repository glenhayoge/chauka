"""Tests for levels configuration in Settings model and bootstrap."""

import pytest

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models.appconf import Settings
from app.models.contacts import User
from app.models.logframe import Logframe, Result
from app.schemas.logframe import SettingsRead, SettingsUpdate
from app.services.bootstrap import _build_levels, get_bootstrap_data


# --- _build_levels unit tests ---


class TestBuildLevels:
    def test_default_three_levels(self):
        levels = _build_levels(3)
        assert levels == {"1": "Impact (Goal)", "2": "Outcome", "3": "Output"}

    def test_single_level(self):
        levels = _build_levels(1)
        assert levels == {"1": "Impact (Goal)"}

    def test_four_levels_adds_generic(self):
        levels = _build_levels(4)
        assert levels == {
            "1": "Impact (Goal)",
            "2": "Outcome",
            "3": "Output",
            "4": "Level 4",
        }

    def test_five_levels(self):
        levels = _build_levels(5)
        assert levels["4"] == "Level 4"
        assert levels["5"] == "Level 5"
        assert len(levels) == 5

    def test_zero_levels_empty(self):
        levels = _build_levels(0)
        assert levels == {}


# --- Schema tests ---


class TestSettingsSchemas:
    def test_settings_read_includes_level_fields(self):
        data = SettingsRead(
            id=1,
            logframe_id=1,
            name="Test",
            description="",
            start_month=1,
            start_year=2026,
            end_year=2028,
            n_periods=4,
            currency="GBP",
            max_result_level=3,
            open_result_level=2,
        )
        assert data.max_result_level == 3
        assert data.open_result_level == 2

    def test_settings_update_partial_level_fields(self):
        data = SettingsUpdate(max_result_level=4)
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {"max_result_level": 4}
        assert "open_result_level" not in dumped

    def test_settings_update_both_level_fields(self):
        data = SettingsUpdate(max_result_level=5, open_result_level=3)
        dumped = data.model_dump(exclude_unset=True)
        assert dumped["max_result_level"] == 5
        assert dumped["open_result_level"] == 3


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
    """Seed a logframe, settings, user, and result."""
    user = User(
        id=1, username="testuser", password="hashed",
        is_staff=True, is_active=True,
    )
    db_session.add(user)

    logframe = Logframe(id=1, name="Test Logframe")
    db_session.add(logframe)

    settings = Settings(
        id=1, logframe_id=1, name="Test Settings",
        description="", start_month=1, start_year=2026,
        end_year=2028, n_periods=4, currency="GBP",
        max_result_level=3, open_result_level=2,
    )
    db_session.add(settings)

    result = Result(id=1, name="Goal", logframe_id=1, order=0, level=1)
    db_session.add(result)

    await db_session.commit()
    return {"user": user, "logframe": logframe, "settings": settings, "result": result}


async def test_settings_model_level_fields(db_session: AsyncSession, seed_data):
    """Verify new level fields are persisted correctly."""
    result = await db_session.execute(select(Settings).where(Settings.id == 1))
    settings = result.scalar_one()
    assert settings.max_result_level == 3
    assert settings.open_result_level == 2


async def test_settings_model_defaults(db_session: AsyncSession):
    """Verify defaults when level fields are not specified."""
    user = User(id=1, username="u", password="p", is_staff=True, is_active=True)
    logframe = Logframe(id=1, name="LF")
    settings = Settings(
        id=1, logframe_id=1, name="S", start_month=1,
        start_year=2026, end_year=2028, n_periods=1, currency="GBP",
    )
    db_session.add_all([user, logframe, settings])
    await db_session.commit()

    result = await db_session.execute(select(Settings).where(Settings.id == 1))
    s = result.scalar_one()
    assert s.max_result_level == 3
    assert s.open_result_level == 0


async def test_bootstrap_includes_levels_and_conf(db_session: AsyncSession, seed_data):
    """Verify bootstrap response includes levels dict and conf object."""
    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert data is not None
    assert "levels" in data
    assert "conf" in data

    assert data["levels"] == {"1": "Impact (Goal)", "2": "Outcome", "3": "Output"}
    assert data["conf"]["max_result_level"] == 3
    assert data["conf"]["open_result_level"] == 2


async def test_bootstrap_levels_no_settings(db_session: AsyncSession):
    """Verify bootstrap defaults when no settings exist for the logframe."""
    user = User(id=1, username="u", password="p", is_staff=True, is_active=True)
    logframe = Logframe(id=1, name="LF")
    db_session.add_all([user, logframe])
    await db_session.commit()

    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert data is not None
    assert data["levels"] == {"1": "Impact (Goal)", "2": "Outcome", "3": "Output"}
    assert data["conf"]["max_result_level"] == 3
    assert data["conf"]["open_result_level"] == 0


async def test_bootstrap_custom_max_level(db_session: AsyncSession):
    """Verify bootstrap with custom max_result_level produces extra levels."""
    user = User(id=1, username="u", password="p", is_staff=True, is_active=True)
    logframe = Logframe(id=1, name="LF")
    settings = Settings(
        id=1, logframe_id=1, name="S", start_month=1,
        start_year=2026, end_year=2028, n_periods=1, currency="GBP",
        max_result_level=5, open_result_level=1,
    )
    db_session.add_all([user, logframe, settings])
    await db_session.commit()

    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert data is not None
    assert len(data["levels"]) == 5
    assert data["levels"]["4"] == "Level 4"
    assert data["levels"]["5"] == "Level 5"
    assert data["conf"]["max_result_level"] == 5
    assert data["conf"]["open_result_level"] == 1
