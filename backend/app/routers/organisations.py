from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Logframe
from app.models.org import Organisation, OrganisationMembership, Project, ProjectRole
from app.schemas.logframe import LogframeRead
from app.schemas.org import (
    OrganisationCreate,
    OrganisationRead,
    OrganisationUpdate,
    OrgDashboardRead,
    ProjectCreate,
    ProjectRead,
)
from app.services.dashboard import get_org_dashboard
from app.services.rbac import is_org_member

router = APIRouter(prefix="/api/organisations", tags=["organisations"])


@router.get("/", response_model=list[OrganisationRead])
async def list_organisations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List organisations the current user belongs to (as member or owner)."""
    member_org_ids = select(OrganisationMembership.organisation_id).where(
        OrganisationMembership.user_id == current_user.id
    )
    result = await db.execute(
        select(Organisation)
        .where(
            (Organisation.id.in_(member_org_ids)) | (Organisation.owner_id == current_user.id)
        )
        .order_by(Organisation.name)
    )
    return result.scalars().all()


@router.post("/", response_model=OrganisationRead, status_code=201)
async def create_organisation(
    body: OrganisationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any authenticated user can create an organisation. Creator becomes admin."""
    # Check slug uniqueness
    existing = await db.execute(
        select(Organisation).where(Organisation.slug == body.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Organisation slug already exists")

    data = body.model_dump()
    data["owner_id"] = current_user.id
    obj = Organisation(**data)
    db.add(obj)
    await db.flush()

    # Auto-create admin membership for the creator
    membership = OrganisationMembership(
        user_id=current_user.id,
        organisation_id=obj.id,
        role="admin",
    )
    db.add(membership)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{organisation_id}", response_model=OrganisationRead)
async def get_organisation(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return obj


@router.get("/{organisation_id}/dashboard", response_model=OrgDashboardRead)
async def organisation_dashboard(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregated dashboard for an organisation across all its logframes.

    Requires org membership (or ownership).
    """
    result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    # Check membership: must be org member or owner
    if org.owner_id != current_user.id and not await is_org_member(
        current_user.id, organisation_id, db
    ):
        raise HTTPException(status_code=403, detail="Not a member of this organisation")

    dashboard_data = await get_org_dashboard(organisation_id, db)
    return dashboard_data


@router.patch("/{organisation_id}", response_model=OrganisationRead)
async def update_organisation(
    organisation_id: int,
    body: OrganisationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Organisation not found")

    updates = body.model_dump(exclude_unset=True)
    # Check slug uniqueness if slug is being changed
    if "slug" in updates and updates["slug"] != obj.slug:
        existing = await db.execute(
            select(Organisation).where(Organisation.slug == updates["slug"])
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Organisation slug already exists")

    for field, value in updates.items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{organisation_id}", status_code=204)
async def delete_organisation(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Organisation not found")
    await db.delete(obj)
    await db.commit()


# --- Standalone projects (directly under org, no program) ---

@router.get("/{organisation_id}/projects/", response_model=list[ProjectRead])
async def list_org_projects(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List projects directly under an organisation (no program)."""
    result = await db.execute(
        select(Project)
        .where(Project.organisation_id == organisation_id, Project.program_id.is_(None))
        .order_by(Project.name)
    )
    return result.scalars().all()


@router.post("/{organisation_id}/projects/", response_model=ProjectRead, status_code=201)
async def create_org_project(
    organisation_id: int,
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a standalone project directly under an organisation."""
    org = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    if not org.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organisation not found")

    data = body.model_dump()
    data["organisation_id"] = organisation_id
    data["program_id"] = None
    obj = Project(**data)
    db.add(obj)
    await db.flush()

    # Auto-assign creator as project lead
    role = ProjectRole(user_id=current_user.id, project_id=obj.id, role="lead")
    db.add(role)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{organisation_id}/projects/{project_id}/logframes", response_model=list[LogframeRead])
async def list_org_project_logframes(
    organisation_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List logframes in a standalone org project."""
    result = await db.execute(
        select(Logframe).where(Logframe.project_id == project_id)
    )
    return result.scalars().all()


@router.post("/{organisation_id}/projects/{project_id}/logframes", response_model=LogframeRead, status_code=201)
async def create_org_project_logframe(
    organisation_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a logframe in a standalone org project with default settings."""
    from pydantic import BaseModel
    from app.models.appconf import Settings
    from app.models.logframe import Period, Rating, RiskRating

    proj = await db.execute(
        select(Project).where(Project.id == project_id, Project.organisation_id == organisation_id)
    )
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    obj = Logframe(name="New Logframe", project_id=project_id)
    db.add(obj)
    await db.flush()

    settings = Settings(
        logframe_id=obj.id, name="New Logframe", description="",
        start_month=1, start_year=2026, end_year=2029, n_periods=4,
        currency="USD", max_result_level=3, open_result_level=2,
    )
    db.add(settings)
    for rname, color in [("On Track", "#16a34a"), ("Caution", "#f59e0b"), ("Off Track", "#dc2626")]:
        db.add(Rating(name=rname, color=color, logframe_id=obj.id))
    for rname in ["Low", "Medium", "High"]:
        db.add(RiskRating(name=rname, logframe_id=obj.id))

    month, year = 1, 2026
    while year < 2029:
        end_month = month + 2
        end_year = year
        if end_month > 12:
            end_month -= 12
            end_year += 1
        db.add(Period(start_month=month, start_year=year, end_month=end_month, end_year=end_year, logframe_id=obj.id))
        month = end_month + 1
        year = end_year
        if month > 12:
            month -= 12
            year += 1

    await db.commit()
    await db.refresh(obj)
    return obj
