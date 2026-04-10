from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Assumption, RiskRating
from app.schemas.logframe import (
    AssumptionCreate, AssumptionRead, AssumptionUpdate,
    RiskRatingCreate, RiskRatingRead,
)
from app.security.ownership import verify_result_ownership
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}", tags=["assumptions"])


@router.get("/risk-ratings/", response_model=list[RiskRatingRead])
async def list_risk_ratings(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(RiskRating).where(RiskRating.logframe_id == logframe_id))
    return result.scalars().all()


@router.post("/risk-ratings/", response_model=RiskRatingRead, status_code=201)
async def create_risk_rating(
    logframe_public_id: UUID,
    body: RiskRatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = RiskRating(**body.model_dump(), logframe_id=logframe_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/results/{result_id}/assumptions/", response_model=list[AssumptionRead])
async def list_assumptions(
    logframe_public_id: UUID, result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    result = await db.execute(select(Assumption).where(Assumption.result_id == result_id))
    return result.scalars().all()


@router.post("/results/{result_id}/assumptions/", response_model=AssumptionRead, status_code=201)
async def create_assumption(
    logframe_public_id: UUID, result_id: int,
    body: AssumptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    obj = Assumption(**body.model_dump(exclude={"result_id"}), result_id=result_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/results/{result_id}/assumptions/{assumption_id}", response_model=AssumptionRead)
async def update_assumption(
    logframe_public_id: UUID, result_id: int, assumption_id: int,
    body: AssumptionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    result = await db.execute(
        select(Assumption).where(Assumption.id == assumption_id, Assumption.result_id == result_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Assumption not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/results/{result_id}/assumptions/{assumption_id}", status_code=204)
async def delete_assumption(
    logframe_public_id: UUID, result_id: int, assumption_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    await verify_result_ownership(result_id, logframe_id, db)
    result = await db.execute(
        select(Assumption).where(Assumption.id == assumption_id, Assumption.result_id == result_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Assumption not found")
    await db.delete(obj)
    await db.commit()
