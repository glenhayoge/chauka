from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Resource
from app.schemas.logframe import ResourceCreate, ResourceRead, ResourceUpdate

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/resources",
    tags=["resources"],
)


@router.get("/", response_model=list[ResourceRead])
async def list_resources(
    logframe_id: int,
    activity_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Resource)
    if activity_id:
        stmt = stmt.where(Resource.activity_id == activity_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ResourceRead, status_code=201)
async def create_resource(
    logframe_id: int,
    body: ResourceCreate,
    activity_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    if not activity_id:
        raise HTTPException(status_code=400, detail="activity_id query param required")
    obj = Resource(**body.model_dump(), activity_id=activity_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{resource_id}", response_model=ResourceRead)
async def update_resource(
    logframe_id: int,
    resource_id: int,
    body: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Resource not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    logframe_id: int,
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(obj)
    await db.commit()
