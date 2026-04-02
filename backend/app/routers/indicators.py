from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Indicator, SubIndicator
from app.schemas.logframe import IndicatorCreate, IndicatorRead, IndicatorUpdate
from app.services.ordering import next_order

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/results/{result_id}/indicators",
    tags=["indicators"],
)


@router.get("/", response_model=list[IndicatorRead])
async def list_indicators(
    logframe_id: int,
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Indicator).where(Indicator.result_id == result_id).order_by(Indicator.order)
    )
    return result.scalars().all()


@router.post("/", response_model=IndicatorRead, status_code=201)
async def create_indicator(
    logframe_id: int,
    result_id: int,
    body: IndicatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    order = await next_order(db, Indicator, result_id=result_id)
    data = body.model_dump()
    data.update(order=order, result_id=result_id)
    obj = Indicator(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)

    # Auto-create default SubIndicator (matches Django post_save signal)
    default_sub = SubIndicator(name="", order=1, indicator_id=obj.id)
    db.add(default_sub)
    await db.commit()

    return obj


@router.get("/{indicator_id}", response_model=IndicatorRead)
async def get_indicator(
    logframe_id: int,
    result_id: int,
    indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Indicator).where(
            Indicator.id == indicator_id, Indicator.result_id == result_id
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Indicator not found")
    return obj


@router.patch("/{indicator_id}", response_model=IndicatorRead)
async def update_indicator(
    logframe_id: int,
    result_id: int,
    indicator_id: int,
    body: IndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(Indicator).where(
            Indicator.id == indicator_id, Indicator.result_id == result_id
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Indicator not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{indicator_id}", status_code=204)
async def delete_indicator(
    logframe_id: int,
    result_id: int,
    indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(Indicator).where(
            Indicator.id == indicator_id, Indicator.result_id == result_id
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Indicator not found")
    await db.delete(obj)
    await db.commit()
