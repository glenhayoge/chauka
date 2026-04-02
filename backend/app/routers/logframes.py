from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Logframe
from app.models.org import Organisation, OrganisationMembership, Program, Project
from app.schemas.bootstrap import BootstrapData
from app.schemas.logframe import LogframeRead
from app.services.bootstrap import get_bootstrap_data


class LogframeUpdate(BaseModel):
    name: str | None = None

router = APIRouter(prefix="/api/logframes", tags=["logframes"])


@router.get("/", response_model=list[LogframeRead])
async def list_logframes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List logframes the current user has access to via org membership."""
    from sqlalchemy import or_
    # Find org IDs the user belongs to
    all_org_ids = select(OrganisationMembership.organisation_id).where(
        OrganisationMembership.user_id == current_user.id
    ).union(
        select(Organisation.id).where(Organisation.owner_id == current_user.id)
    )
    # Programs in user's orgs
    user_program_ids = select(Program.id).where(
        Program.organisation_id.in_(all_org_ids)
    )
    # Projects via programs OR directly under orgs
    user_project_ids = select(Project.id).where(
        or_(
            Project.program_id.in_(user_program_ids),
            Project.organisation_id.in_(all_org_ids),
        )
    )
    # Logframes via projects OR directly under programs
    result = await db.execute(
        select(Logframe).where(
            or_(
                Logframe.project_id.in_(user_project_ids),
                Logframe.program_id.in_(user_program_ids),
            )
        )
    )
    return result.scalars().all()


@router.get("/{logframe_id}", response_model=LogframeRead)
async def get_logframe(
    logframe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Logframe).where(Logframe.id == logframe_id))
    logframe = result.scalar_one_or_none()
    if not logframe:
        raise HTTPException(status_code=404, detail="Logframe not found")
    return logframe


@router.patch("/{logframe_id}", response_model=LogframeRead)
async def update_logframe(
    logframe_id: int,
    body: LogframeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Logframe).where(Logframe.id == logframe_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Logframe not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{logframe_id}", status_code=204)
async def delete_logframe(
    logframe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Logframe).where(Logframe.id == logframe_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Logframe not found")
    await db.delete(obj)
    await db.commit()


@router.get("/{logframe_id}/bootstrap", response_model=BootstrapData)
async def bootstrap(
    logframe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await get_bootstrap_data(logframe_id, db, current_user)
    if data is None:
        raise HTTPException(status_code=404, detail="Logframe not found")
    return data
