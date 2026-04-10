from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import SubIndicator
from app.schemas.logframe import SubIndicatorCreate, SubIndicatorRead, SubIndicatorUpdate
from app.services.ordering import next_order
from app.security.ownership import verify_result_ownership, verify_indicator_ownership
from app.services.resolve import resolve_logframe

router = APIRouter(
    prefix="/api/logframes/{logframe_public_id}/results/{result_id}/indicators/{indicator_id}/subindicators",
    tags=["subindicators"],
)


@router.get("/", response_model=list[SubIndicatorRead])
async def list_subindicators(
    logframe_public_id: UUID, result_id: int, indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    await verify_indicator_ownership(indicator_id, result_id, db)
    result = await db.execute(
        select(SubIndicator).where(SubIndicator.indicator_id == indicator_id).order_by(SubIndicator.order)
    )
    return result.scalars().all()


@router.post("/", response_model=SubIndicatorRead, status_code=201)
async def create_subindicator(
    logframe_public_id: UUID, result_id: int, indicator_id: int,
    body: SubIndicatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    await verify_indicator_ownership(indicator_id, result_id, db)
    order = await next_order(db, SubIndicator, indicator_id=indicator_id)
    data = body.model_dump()
    data.update(order=order, indicator_id=indicator_id)
    obj = SubIndicator(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{subindicator_id}", response_model=SubIndicatorRead)
async def update_subindicator(
    logframe_public_id: UUID, result_id: int, indicator_id: int, subindicator_id: int,
    body: SubIndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    await verify_indicator_ownership(indicator_id, result_id, db)
    result = await db.execute(
        select(SubIndicator).where(
            SubIndicator.id == subindicator_id,
            SubIndicator.indicator_id == indicator_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="SubIndicator not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{subindicator_id}", status_code=204)
async def delete_subindicator(
    logframe_public_id: UUID, result_id: int, indicator_id: int, subindicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    await verify_indicator_ownership(indicator_id, result_id, db)
    result = await db.execute(
        select(SubIndicator).where(
            SubIndicator.id == subindicator_id,
            SubIndicator.indicator_id == indicator_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="SubIndicator not found")
    await db.delete(obj)
    await db.commit()
