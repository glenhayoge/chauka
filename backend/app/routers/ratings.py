from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Rating
from app.schemas.logframe import RatingCreate, RatingRead, RatingUpdate
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}/ratings", tags=["ratings"])


@router.get("/", response_model=list[RatingRead])
async def list_ratings(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Rating).where(Rating.logframe_id == logframe_id)
    )
    return result.scalars().all()


@router.post("/", response_model=RatingRead, status_code=201)
async def create_rating(
    logframe_public_id: UUID,
    body: RatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = Rating(name=body.name, color=body.color, logframe_id=logframe_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{rating_id}", response_model=RatingRead)
async def update_rating(
    logframe_public_id: UUID,
    rating_id: int,
    body: RatingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Rating).where(Rating.id == rating_id, Rating.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Rating not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{rating_id}", status_code=204)
async def delete_rating(
    logframe_public_id: UUID,
    rating_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(Rating).where(Rating.id == rating_id, Rating.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Rating not found")
    await db.delete(obj)
    await db.commit()
