from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import DataEntry
from app.schemas.logframe import DataEntryCreate, DataEntryRead, DataEntryUpdate
from app.schemas.pagination import PaginatedResponse
from app.security.ownership import verify_dataentry_belongs_to_logframe
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/data-entries", tags=["data-entries"])


@router.get("/", response_model=PaginatedResponse[DataEntryRead])
async def list_data_entries(
    logframe_public_id: UUID,
    subindicator: int | None = None,
    column: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    filters = []
    if subindicator:
        filters.append(DataEntry.subindicator_id == subindicator)
    if column:
        filters.append(DataEntry.column_id == column)

    count_stmt = select(func.count()).select_from(DataEntry)
    data_stmt = select(DataEntry)
    for f in filters:
        count_stmt = count_stmt.where(f)
        data_stmt = data_stmt.where(f)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    result = await db.execute(
        data_stmt.offset((page - 1) * page_size).limit(page_size)
    )
    return {
        "items": result.scalars().all(),
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/", response_model=DataEntryRead, status_code=201)
async def create_data_entry(
    logframe_public_id: UUID,
    body: DataEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = DataEntry(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{entry_id}", response_model=DataEntryRead)
async def update_data_entry(
    logframe_public_id: UUID, entry_id: int,
    body: DataEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_dataentry_belongs_to_logframe(entry_id, logframe_id, db)
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
    logframe_public_id: UUID, entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_dataentry_belongs_to_logframe(entry_id, logframe_id, db)
    result = await db.execute(select(DataEntry).where(DataEntry.id == entry_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="DataEntry not found")
    await db.delete(obj)
    await db.commit()
