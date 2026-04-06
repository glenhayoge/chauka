from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Result
from app.schemas.logframe import ResultCreate, ResultRead, ResultUpdate
from app.services.ordering import auto_level, next_order
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/results", tags=["results"])


@router.get("/", response_model=list[ResultRead])
async def list_results(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Result).where(Result.logframe_id == logframe_id).order_by(Result.order)
    )
    return result.scalars().all()


@router.post("/", response_model=ResultRead, status_code=201)
async def create_result(
    logframe_public_id: UUID,
    body: ResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    order = await next_order(db, Result, logframe_id=logframe_id)
    level = body.level
    if level is None:
        parent_id = body.parent_id if hasattr(body, 'parent_id') else None
        level = await auto_level(db, Result, logframe_id=logframe_id, parent_id=parent_id)
    data = body.model_dump()
    data.update(order=order, level=level, logframe_id=logframe_id)
    obj = Result(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{result_id}", response_model=ResultRead)
async def get_result(
    logframe_public_id: UUID,
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Result).where(Result.id == result_id, Result.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Result not found")
    return obj


@router.patch("/{result_id}", response_model=ResultRead)
async def update_result(
    logframe_public_id: UUID,
    result_id: int,
    body: ResultUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Result).where(Result.id == result_id, Result.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Result not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{result_id}", status_code=204)
async def delete_result(
    logframe_public_id: UUID,
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Result).where(Result.id == result_id, Result.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Result not found")
    await db.delete(obj)
    await db.commit()
