from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import DataEntry
from app.schemas.logframe import DataEntryCreate, DataEntryRead, DataEntryUpdate

router = APIRouter(prefix="/api/logframes/{logframe_id}/data-entries", tags=["data-entries"])


@router.get("/", response_model=list[DataEntryRead])
async def list_data_entries(
    logframe_id: int,
    subindicator: int | None = None,
    column: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(DataEntry)
    if subindicator:
        stmt = stmt.where(DataEntry.subindicator_id == subindicator)
    if column:
        stmt = stmt.where(DataEntry.column_id == column)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=DataEntryRead, status_code=201)
async def create_data_entry(
    logframe_id: int,
    body: DataEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    obj = DataEntry(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{entry_id}", response_model=DataEntryRead)
async def update_data_entry(
    logframe_id: int, entry_id: int,
    body: DataEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(DataEntry).where(DataEntry.id == entry_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="DataEntry not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{entry_id}", status_code=204)
async def delete_data_entry(
    logframe_id: int, entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(DataEntry).where(DataEntry.id == entry_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="DataEntry not found")
    await db.delete(obj)
    await db.commit()
