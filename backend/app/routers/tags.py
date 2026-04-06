from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import IndicatorTag, Tag
from app.schemas.logframe import IndicatorTagCreate, IndicatorTagRead, TagCreate, TagRead
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/logframes/{logframe_public_id}", tags=["tags"])


@router.get("/tags/", response_model=list[TagRead])
async def list_tags(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(Tag).where(Tag.logframe_id == logframe_id))
    return result.scalars().all()


@router.post("/tags/", response_model=TagRead, status_code=201)
async def create_tag(
    logframe_public_id: UUID,
    body: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = Tag(**body.model_dump(), logframe_id=logframe_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/indicator-tags/", response_model=list[IndicatorTagRead])
async def list_indicator_tags(
    logframe_public_id: UUID,
    indicator: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    stmt = select(IndicatorTag)
    if indicator:
        stmt = stmt.where(IndicatorTag.indicator_id == indicator)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/indicator-tags/", response_model=IndicatorTagRead, status_code=201)
async def create_indicator_tag(
    logframe_public_id: UUID,
    body: IndicatorTagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    obj = IndicatorTag(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/indicator-tags/{tag_id}", status_code=204)
async def delete_indicator_tag(
    logframe_public_id: UUID, tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(select(IndicatorTag).where(IndicatorTag.id == tag_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="IndicatorTag not found")
    await db.delete(obj)
    await db.commit()
