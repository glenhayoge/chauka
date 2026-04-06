from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Period, ReportingPeriod, StatusCode
from app.schemas.logframe import (
    PeriodCreate, PeriodRead,
    ReportingPeriodCreate, ReportingPeriodRead, ReportingPeriodUpdate,
    StatusCodeCreate, StatusCodeRead,
)
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}", tags=["periods"])


@router.get("/periods/", response_model=list[PeriodRead])
async def list_periods(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(Period).where(Period.logframe_id == logframe_id))
    return result.scalars().all()


@router.post("/periods/", response_model=PeriodRead, status_code=201)
async def create_period(
    logframe_public_id: UUID,
    body: PeriodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = Period(**body.model_dump(), logframe_id=logframe_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/reporting-periods/", response_model=list[ReportingPeriodRead])
async def list_reporting_periods(
    logframe_public_id: UUID,
    period: int | None = None,
    subindicator: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    stmt = select(ReportingPeriod)
    if period:
        stmt = stmt.where(ReportingPeriod.period_id == period)
    if subindicator:
        stmt = stmt.where(ReportingPeriod.subindicator_id == subindicator)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/reporting-periods/", response_model=ReportingPeriodRead, status_code=201)
async def create_reporting_period(
    logframe_public_id: UUID,
    body: ReportingPeriodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = ReportingPeriod(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/reporting-periods/{rp_id}", response_model=ReportingPeriodRead)
async def update_reporting_period(
    logframe_public_id: UUID, rp_id: int,
    body: ReportingPeriodUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(ReportingPeriod).where(ReportingPeriod.id == rp_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="ReportingPeriod not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/status-codes/", response_model=list[StatusCodeRead])
async def list_status_codes(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(StatusCode).where(StatusCode.logframe_id == logframe_id))
    return result.scalars().all()


@router.post("/status-codes/", response_model=StatusCodeRead, status_code=201)
async def create_status_code(
    logframe_public_id: UUID,
    body: StatusCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = StatusCode(**body.model_dump(), logframe_id=logframe_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj
