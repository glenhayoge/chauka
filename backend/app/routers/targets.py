from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Target
from app.schemas.logframe import TargetCreate, TargetRead, TargetUpdate
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/targets", tags=["targets"])


@router.get("/", response_model=list[TargetRead])
async def list_targets(
    logframe_public_id: UUID,
    subindicator: int | None = None,
    milestone: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    stmt = select(Target)
    if subindicator:
        stmt = stmt.where(Target.subindicator_id == subindicator)
    if milestone:
        stmt = stmt.where(Target.milestone_id == milestone)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=TargetRead, status_code=201)
async def create_target(
    logframe_public_id: UUID,
    body: TargetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = Target(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{target_id}", response_model=TargetRead)
async def update_target(
    logframe_public_id: UUID,
    target_id: int,
    body: TargetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(Target).where(Target.id == target_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Target not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{target_id}", status_code=204)
async def delete_target(
    logframe_public_id: UUID,
    target_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(Target).where(Target.id == target_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Target not found")
    await db.delete(obj)
    await db.commit()
