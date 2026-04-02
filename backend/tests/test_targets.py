"""Tests for Target model, schemas, and bootstrap integration."""

import pytest

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models.appconf import Settings
from app.models.contacts import User
from app.models.logframe import (
    Indicator, Logframe, Period, Result, SubIndicator, Target,
)
from app.schemas.logframe import TargetCreate, TargetRead, TargetUpdate
from app.services.bootstrap import get_bootstrap_data


# --- Schema tests ---


class TestTargetSchemas:
    def test_target_create(self):
        data = TargetCreate(
            indicator_id=1, subindicator_id=1, milestone_id=1, value="100"
        )
        assert data.indicator_id == 1
        assert data.value == "100"

    def test_target_create_null_value(self):
        data = TargetCreate(
            indicator_id=1, subindicator_id=1, milestone_id=1
        )
        assert data.value is None

    def test_target_update_partial(self):
        data = TargetUpdate(value="200")
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {"value": "200"}

    def test_target_update_empty(self):
        data = TargetUpdate()
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {}

    def test_target_read_from_attributes(self):
        data = TargetRead(
            id=1, indicator_id=1, subindicator_id=1,
            milestone_id=1, value="50",
        )
        assert data.id == 1
        assert data.value == "50"


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
    """Seed logframe with indicator, subindicator, period, and target."""
    user = User(
        id=1, username="testuser", password="hashed",
        is_staff=True, is_active=True,
    )
    logframe = Logframe(id=1, name="Test Logframe")
    result = Result(id=1, name="Goal", logframe_id=1, order=0, level=1)
    indicator = Indicator(
        id=1, name="Ind 1", result_id=1, order=0,
    )
    subindicator = SubIndicator(id=1, name="Sub 1", indicator_id=1, order=0)
    period = Period(
        id=1, start_month=1, start_year=2026,
        end_month=3, end_year=2026, logframe_id=1,
    )
    target = Target(
        id=1, indicator_id=1, subindicator_id=1,
        milestone_id=1, value="100",
    )

    db_session.add_all([user, logframe, result, indicator, subindicator, period, target])
    await db_session.commit()
    return {
        "user": user, "logframe": logframe, "result": result,
        "indicator": indicator, "subindicator": subindicator,
        "period": period, "target": target,
    }


async def test_target_model_persists(db_session: AsyncSession, seed_data):
    """Verify target fields are persisted correctly."""
    result = await db_session.execute(select(Target).where(Target.id == 1))
    target = result.scalar_one()
    assert target.indicator_id == 1
    assert target.subindicator_id == 1
    assert target.milestone_id == 1
    assert target.value == "100"


async def test_target_nullable_value(db_session: AsyncSession, seed_data):
    """Verify target can have null value."""
    target = Target(id=2, indicator_id=1, subindicator_id=1, milestone_id=1, value=None)
    db_session.add(target)
    await db_session.commit()

    result = await db_session.execute(select(Target).where(Target.id == 2))
    obj = result.scalar_one()
    assert obj.value is None


async def test_target_relationships(db_session: AsyncSession, seed_data):
    """Verify target relationships load correctly."""
    result = await db_session.execute(select(Target).where(Target.id == 1))
    target = result.scalar_one()

    # Refresh to load relationships
    await db_session.refresh(target, ["indicator", "subindicator", "milestone"])
    assert target.indicator.name == "Ind 1"
    assert target.subindicator.name == "Sub 1"
    assert target.milestone.start_year == 2026


async def test_bootstrap_includes_targets(db_session: AsyncSession, seed_data):
    """Verify bootstrap response includes targets."""
    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert data is not None
    assert "targets" in data
    assert len(data["targets"]) == 1
    assert data["targets"][0]["value"] == "100"
    assert data["targets"][0]["indicator_id"] == 1
    assert data["targets"][0]["subindicator_id"] == 1
    assert data["targets"][0]["milestone_id"] == 1


async def test_bootstrap_no_targets(db_session: AsyncSession):
    """Verify bootstrap works when no targets exist."""
    user = User(id=1, username="u", password="p", is_staff=True, is_active=True)
    logframe = Logframe(id=1, name="LF")
    db_session.add_all([user, logframe])
    await db_session.commit()

    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)
    assert data is not None
    assert data["targets"] == []


async def test_multiple_targets_per_subindicator(db_session: AsyncSession, seed_data):
    """Verify multiple targets for same subindicator with different periods."""
    period2 = Period(
        id=2, start_month=4, start_year=2026,
        end_month=6, end_year=2026, logframe_id=1,
    )
    target2 = Target(
        id=2, indicator_id=1, subindicator_id=1,
        milestone_id=2, value="200",
    )
    db_session.add_all([period2, target2])
    await db_session.commit()

    user = seed_data["user"]
    data = await get_bootstrap_data(logframe_id=1, db=db_session, current_user=user)

    assert len(data["targets"]) == 2
    values = {t["value"] for t in data["targets"]}
    assert values == {"100", "200"}
