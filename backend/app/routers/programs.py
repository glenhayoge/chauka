from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.contacts import User
from app.models.appconf import Settings
from app.models.logframe import Logframe, Period, Rating, RiskRating
from app.models.org import Organisation, Program
from app.schemas.logframe import LogframeRead
from app.schemas.org import ProgramCreate, ProgramRead, ProgramUpdate

router = APIRouter(
    prefix="/api/organisations/{organisation_id}/programs",
    tags=["programs"],
)


@router.get("/", response_model=list[ProgramRead])
async def list_programs(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify organisation exists
    org = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    if not org.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organisation not found")

    result = await db.execute(
        select(Program)
        .where(Program.organisation_id == organisation_id)
        .order_by(Program.name)
    )
    return result.scalars().all()


@router.post("/", response_model=ProgramRead, status_code=201)
async def create_program(
    organisation_id: int,
    body: ProgramCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    if not org.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organisation not found")

    data = body.model_dump()
    data["organisation_id"] = organisation_id
    obj = Program(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{program_id}", response_model=ProgramRead)
async def get_program(
    organisation_id: int,
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Program).where(
            Program.id == program_id,
            Program.organisation_id == organisation_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Program not found")
    return obj


@router.patch("/{program_id}", response_model=ProgramRead)
async def update_program(
    organisation_id: int,
    program_id: int,
    body: ProgramUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Program).where(
            Program.id == program_id,
            Program.organisation_id == organisation_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Program not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{program_id}", status_code=204)
async def delete_program(
    organisation_id: int,
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Program).where(
            Program.id == program_id,
            Program.organisation_id == organisation_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Program not found")
    await db.delete(obj)
    await db.commit()


@router.get("/{program_id}/logframes", response_model=list[LogframeRead])
async def list_program_logframes(
    organisation_id: int,
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List logframes directly under a program (no project)."""
    result = await db.execute(
        select(Logframe).where(Logframe.program_id == program_id)
    )
    return result.scalars().all()


@router.post("/{program_id}/logframes", response_model=LogframeRead, status_code=201)
async def create_program_logframe(
    organisation_id: int,
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a logframe directly under a program (no project needed)."""
    from pydantic import BaseModel

    class Body(BaseModel):
        name: str
        start_year: int = 2025
        end_year: int = 2028
        start_month: int = 1
        n_periods: int = 4
        currency: str = "USD"

    # Read body manually since we defined it inline
    from fastapi import Request
    # Actually, let's use a simpler approach — duplicate the seed logic
    prog = await db.execute(select(Program).where(
        Program.id == program_id, Program.organisation_id == organisation_id
    ))
    if not prog.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Program not found")

    obj = Logframe(name="New Logframe", program_id=program_id)
    db.add(obj)
    await db.flush()

    settings = Settings(
        logframe_id=obj.id, name="New Logframe", description="",
        start_month=1, start_year=2025, end_year=2028, n_periods=4,
        currency="USD", max_result_level=3, open_result_level=2,
    )
    db.add(settings)
    for rname, color in [("On Track", "#16a34a"), ("Caution", "#f59e0b"), ("Off Track", "#dc2626")]:
        db.add(Rating(name=rname, color=color, logframe_id=obj.id))
    for rname in ["Low", "Medium", "High"]:
        db.add(RiskRating(name=rname, logframe_id=obj.id))

    month, year = 1, 2025
    while year < 2028:
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
