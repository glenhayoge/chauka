from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Target
from app.schemas.logframe import TargetCreate, TargetRead, TargetUpdate
from app.schemas.pagination import PaginatedResponse
from app.security.ownership import verify_target_belongs_to_logframe
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/targets", tags=["targets"])


@router.get("/", response_model=PaginatedResponse[TargetRead])
async def list_targets(
    logframe_public_id: UUID,
    subindicator: int | None = None,
    milestone: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    filters = []
    if subindicator:
        filters.append(Target.subindicator_id == subindicator)
    if milestone:
        filters.append(Target.milestone_id == milestone)

    count_stmt = select(func.count()).select_from(Target)
    data_stmt = select(Target)
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
    await verify_target_belongs_to_logframe(target_id, logframe_id, db)
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
    await verify_target_belongs_to_logframe(target_id, logframe_id, db)
    result = await db.execute(select(Target).where(Target.id == target_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Target not found")
    await db.delete(obj)
    await db.commit()
