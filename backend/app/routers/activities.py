from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Activity
from app.schemas.logframe import ActivityCreate, ActivityRead, ActivityUpdate
from app.services.ordering import next_order
from app.security.ownership import verify_result_ownership
from app.services.resolve import resolve_logframe

router = APIRouter(
    prefix="/api/logframes/{logframe_public_id}/results/{result_id}/activities",
    tags=["activities"],
)


@router.get("/", response_model=list[ActivityRead])
async def list_activities(
    logframe_public_id: UUID, result_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    stmt = select(Activity).where(Activity.result_id == result_id).order_by(Activity.order)
    if start_date:
        stmt = stmt.where(Activity.start_date >= start_date)
    if end_date:
        stmt = stmt.where(Activity.end_date <= end_date)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ActivityRead, status_code=201)
async def create_activity(
    logframe_public_id: UUID, result_id: int,
    body: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    order = await next_order(db, Activity, result_id=result_id)
    data = body.model_dump()
    data.update(order=order, result_id=result_id)
    obj = Activity(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{activity_id}", response_model=ActivityRead)
async def update_activity(
    logframe_public_id: UUID, result_id: int, activity_id: int,
    body: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    result = await db.execute(
        select(Activity).where(Activity.id == activity_id, Activity.result_id == result_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    logframe_public_id: UUID, result_id: int, activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    result = await db.execute(
        select(Activity).where(Activity.id == activity_id, Activity.result_id == result_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Activity not found")
    await db.delete(obj)
    await db.commit()
