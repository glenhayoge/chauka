from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import SubIndicator
from app.schemas.logframe import SubIndicatorCreate, SubIndicatorRead, SubIndicatorUpdate
from app.services.ordering import next_order

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/results/{result_id}/indicators/{indicator_id}/subindicators",
    tags=["subindicators"],
)


@router.get("/", response_model=list[SubIndicatorRead])
async def list_subindicators(
    logframe_id: int, result_id: int, indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SubIndicator).where(SubIndicator.indicator_id == indicator_id).order_by(SubIndicator.order)
    )
    return result.scalars().all()


@router.post("/", response_model=SubIndicatorRead, status_code=201)
async def create_subindicator(
    logframe_id: int, result_id: int, indicator_id: int,
    body: SubIndicatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
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
    logframe_id: int, result_id: int, indicator_id: int, subindicator_id: int,
    body: SubIndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
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
    logframe_id: int, result_id: int, indicator_id: int, subindicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
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
