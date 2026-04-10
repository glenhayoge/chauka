from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import TALine
from app.schemas.logframe import TALineCreate, TALineRead, TALineUpdate
from app.security.ownership import verify_taline_belongs_to_logframe
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/talines", tags=["talines"])


@router.get("/", response_model=list[TALineRead])
async def list_ta_lines(
    logframe_public_id: UUID,
    activity: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    stmt = select(TALine)
    if activity:
        stmt = stmt.where(TALine.activity_id == activity)
    if start_date:
        stmt = stmt.where(TALine.start_date >= start_date)
    if end_date:
        stmt = stmt.where(TALine.end_date <= end_date)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=TALineRead, status_code=201)
async def create_ta_line(
    logframe_public_id: UUID,
    body: TALineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = TALine(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{ta_line_id}", response_model=TALineRead)
async def update_ta_line(
    logframe_public_id: UUID,
    ta_line_id: int,
    body: TALineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_taline_belongs_to_logframe(ta_line_id, logframe_id, db)
    result = await db.execute(select(TALine).where(TALine.id == ta_line_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="TALine not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{ta_line_id}", status_code=204)
async def delete_ta_line(
    logframe_public_id: UUID,
    ta_line_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_taline_belongs_to_logframe(ta_line_id, logframe_id, db)
    result = await db.execute(select(TALine).where(TALine.id == ta_line_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="TALine not found")
    await db.delete(obj)
    await db.commit()
