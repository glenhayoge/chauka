from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.appconf import Settings
from app.models.contacts import User
from app.schemas.logframe import SettingsRead, SettingsUpdate

router = APIRouter(prefix="/api/logframes/{logframe_id}/settings", tags=["settings"])


@router.get("/", response_model=SettingsRead)
async def get_settings(
    logframe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Settings).where(Settings.logframe_id == logframe_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Settings not found")
    return obj


@router.patch("/", response_model=SettingsRead)
async def update_settings(
    logframe_id: int,
    body: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(Settings).where(Settings.logframe_id == logframe_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Settings not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj
