from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.auth.dependencies import get_current_user, require_org_admin, require_org_member
from app.database import get_db
from app.models.contacts import User
from app.models.appconf import Settings
from app.models.logframe import Logframe, Period, Rating, RiskRating
from app.models.org import Program, Project, ProjectRole
from app.schemas.logframe import LogframeRead
from app.schemas.org import ProjectCreate, ProjectRead, ProjectUpdate


class LogframeCreate(BaseModel):
    name: str
    start_year: int = 2025
    end_year: int = 2028
    start_month: int = 1
    n_periods: int = 4
    currency: str = "USD"

router = APIRouter(
    prefix="/api/organisations/{organisation_id}/programs/{program_id}/projects",
    tags=["projects"],
)


@router.get("/", response_model=list[ProjectRead])
async def list_projects(
    organisation_id: int,
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_member),
):
    # Verify program exists and belongs to org
    prog = await db.execute(
        select(Program).where(
            Program.id == program_id,
            Program.organisation_id == organisation_id,
        )
    )
    if not prog.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Program not found")

    result = await db.execute(
        select(Project)
        .where(Project.program_id == program_id)
        .order_by(Project.name)
    )
    return result.scalars().all()


@router.post("/", response_model=ProjectRead, status_code=201)
async def create_project(
    organisation_id: int,
    program_id: int,
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    prog = await db.execute(
        select(Program).where(
            Program.id == program_id,
            Program.organisation_id == organisation_id,
        )
    )
    if not prog.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Program not found")

    data = body.model_dump()
    data["program_id"] = program_id
    obj = Project(**data)
    db.add(obj)
    await db.flush()

    # Auto-assign creator as project lead
    role = ProjectRole(user_id=current_user.id, project_id=obj.id, role="lead")
    db.add(role)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    organisation_id: int,
    program_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_member),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.program_id == program_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Project not found")
    return obj


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    organisation_id: int,
    program_id: int,
    project_id: int,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.program_id == program_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    organisation_id: int,
    program_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.program_id == program_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(obj)
    await db.commit()


@router.get("/{project_id}/logframes", response_model=list[LogframeRead])
async def list_project_logframes(
    organisation_id: int,
    program_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_member),
):
    """List logframes belonging to a specific project."""
    proj = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.program_id == program_id,
        )
    )
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Logframe).where(Logframe.project_id == project_id)
    )
    return result.scalars().all()


@router.post("/{project_id}/logframes", response_model=LogframeRead, status_code=201)
async def create_project_logframe(
    organisation_id: int,
    program_id: int,
    project_id: int,
    body: LogframeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Create a new logframe under a project with default settings and ratings."""
    proj = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.program_id == program_id,
        )
    )
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    obj = Logframe(name=body.name, project_id=project_id)
    db.add(obj)
    await db.flush()

    # Seed settings from user-provided values
    settings = Settings(
        logframe_id=obj.id,
        name=body.name,
        description="",
        start_month=body.start_month,
        start_year=body.start_year,
        end_year=body.end_year,
        n_periods=body.n_periods,
        currency=body.currency,
        max_result_level=3,
        open_result_level=2,
    )
    db.add(settings)

    # Seed default ratings (traffic-light system)
    for name, color in [
        ("On Track", "#16a34a"),
        ("Caution", "#f59e0b"),
        ("Off Track", "#dc2626"),
    ]:
        db.add(Rating(name=name, color=color, logframe_id=obj.id))

    # Seed default risk ratings
    for name in ["Low", "Medium", "High"]:
        db.add(RiskRating(name=name, logframe_id=obj.id))

    # Generate periods from settings
    n_periods = body.n_periods
    month = body.start_month
    year = body.start_year
    while year < settings.end_year or (year == settings.end_year and month <= 12):
        end_month = month + (12 // n_periods) - 1
        end_year = year
        if end_month > 12:
            end_month -= 12
            end_year += 1
        db.add(Period(
            start_month=month,
            start_year=year,
            end_month=end_month,
            end_year=end_year,
            logframe_id=obj.id,
        ))
        month = end_month + 1
        year = end_year
        if month > 12:
            month -= 12
            year += 1
        if year > settings.end_year:
            break

    await db.commit()
    await db.refresh(obj)
    return obj
