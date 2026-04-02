from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import StatusUpdate
from app.schemas.logframe import StatusUpdateCreate, StatusUpdateRead, StatusUpdateUpdate

router = APIRouter(prefix="/api/logframes/{logframe_id}/statusupdates", tags=["statusupdates"])


@router.get("/", response_model=list[StatusUpdateRead])
async def list_status_updates(
    logframe_id: int,
    activity: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(StatusUpdate)
    if activity:
        stmt = stmt.where(StatusUpdate.activity_id == activity)
    if start_date:
        stmt = stmt.where(StatusUpdate.date >= start_date)
    if end_date:
        stmt = stmt.where(StatusUpdate.date <= end_date)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=StatusUpdateRead, status_code=201)
async def create_status_update(
    logframe_id: int,
    body: StatusUpdateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    data = body.model_dump()
    data["user_id"] = current_user.id
    obj = StatusUpdate(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{status_update_id}", response_model=StatusUpdateRead)
async def update_status_update(
    logframe_id: int,
    status_update_id: int,
    body: StatusUpdateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(StatusUpdate).where(StatusUpdate.id == status_update_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="StatusUpdate not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{status_update_id}", status_code=204)
async def delete_status_update(
    logframe_id: int,
    status_update_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(StatusUpdate).where(StatusUpdate.id == status_update_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="StatusUpdate not found")
    await db.delete(obj)
    await db.commit()
