from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Column
from app.schemas.logframe import ColumnCreate, ColumnRead, ColumnUpdate
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/columns", tags=["columns"])


@router.get("/", response_model=list[ColumnRead])
async def list_columns(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(Column).where(Column.logframe_id == logframe_id))
    return result.scalars().all()


@router.post("/", response_model=ColumnRead, status_code=201)
async def create_column(
    logframe_public_id: UUID,
    body: ColumnCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = Column(**body.model_dump(), logframe_id=logframe_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{column_id}", response_model=ColumnRead)
async def update_column(
    logframe_public_id: UUID, column_id: int,
    body: ColumnUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Column).where(Column.id == column_id, Column.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Column not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{column_id}", status_code=204)
async def delete_column(
    logframe_public_id: UUID, column_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Column).where(Column.id == column_id, Column.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Column not found")
    await db.delete(obj)
    await db.commit()
