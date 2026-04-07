from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.contacts import User
from app.models.indicator_library import LibraryIndicator, LibraryIndicatorSector
from app.models.logframe import Indicator, SubIndicator
from app.schemas.indicator_library import (
    LibraryIndicatorCreate,
    LibraryIndicatorRead,
    LibraryIndicatorSearchResult,
    LibraryIndicatorUpdate,
    SectorRead,
    UseLibraryIndicatorRequest,
)
from app.schemas.logframe import IndicatorRead
from app.services.ordering import next_order
from app.services.rbac import can_edit_logframe, is_org_admin, is_org_member
from app.services.resolve import resolve_logframe

router = APIRouter(prefix="/api/indicator-library", tags=["indicator-library"])


@router.get("/sectors/", response_model=list[SectorRead])
async def list_sectors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LibraryIndicatorSector).order_by(LibraryIndicatorSector.order)
    )
    return result.scalars().all()


@router.get("/", response_model=LibraryIndicatorSearchResult)
async def search_library_indicators(
    q: str | None = Query(None, description="Keyword search"),
    sector: str | None = Query(None),
    result_level: str | None = Query(None),
    framework: str | None = Query(None),
    organisation_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(LibraryIndicator).where(LibraryIndicator.is_active.is_(True))

    # Scope: global + org-specific (if org member)
    if organisation_id:
        if not await is_org_member(current_user.id, organisation_id, db):
            raise HTTPException(status_code=403, detail="Not a member of this organisation")
        stmt = stmt.where(
            (LibraryIndicator.organisation_id.is_(None))
            | (LibraryIndicator.organisation_id == organisation_id)
        )
    else:
        stmt = stmt.where(LibraryIndicator.organisation_id.is_(None))

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            (LibraryIndicator.name.ilike(pattern))
            | (LibraryIndicator.definition.ilike(pattern))
            | (LibraryIndicator.framework_code.ilike(pattern))
        )
    if sector:
        stmt = stmt.where(LibraryIndicator.sector == sector)
    if result_level:
        stmt = stmt.where(LibraryIndicator.result_level == result_level)
    if framework:
        stmt = stmt.where(LibraryIndicator.framework == framework)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(LibraryIndicator.name).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(stmt)).scalars().all()

    return LibraryIndicatorSearchResult(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{indicator_id}", response_model=LibraryIndicatorRead)
async def get_library_indicator(
    indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LibraryIndicator).where(LibraryIndicator.id == indicator_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Library indicator not found")
    return obj


@router.post("/", response_model=LibraryIndicatorRead, status_code=201)
async def create_library_indicator(
    body: LibraryIndicatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not await is_org_admin(current_user.id, body.organisation_id, db):
        raise HTTPException(status_code=403, detail="Org admin required")

    data = body.model_dump()
    data["created_by_id"] = current_user.id
    data["framework"] = data.get("framework") or "Custom"
    obj = LibraryIndicator(**data)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{indicator_id}", response_model=LibraryIndicatorRead)
async def update_library_indicator(
    indicator_id: int,
    body: LibraryIndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LibraryIndicator).where(LibraryIndicator.id == indicator_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Library indicator not found")
    if obj.organisation_id is None:
        raise HTTPException(status_code=403, detail="Cannot edit global indicators")
    if not await is_org_admin(current_user.id, obj.organisation_id, db):
        raise HTTPException(status_code=403, detail="Org admin required")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{indicator_id}", status_code=204)
async def delete_library_indicator(
    indicator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LibraryIndicator).where(LibraryIndicator.id == indicator_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Library indicator not found")
    if obj.organisation_id is None:
        raise HTTPException(status_code=403, detail="Cannot delete global indicators")
    if not await is_org_admin(current_user.id, obj.organisation_id, db):
        raise HTTPException(status_code=403, detail="Org admin required")

    await db.delete(obj)
    await db.commit()


@router.post("/{indicator_id}/use", response_model=IndicatorRead, status_code=201)
async def use_library_indicator(
    indicator_id: int,
    body: UseLibraryIndicatorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Copy a library indicator template into a logframe result as a new Indicator."""
    # Load library indicator
    result = await db.execute(
        select(LibraryIndicator).where(LibraryIndicator.id == indicator_id)
    )
    lib = result.scalar_one_or_none()
    if not lib:
        raise HTTPException(status_code=404, detail="Library indicator not found")

    # Resolve logframe and check edit permission
    logframe = await resolve_logframe(UUID(body.logframe_public_id), db)
    if not await can_edit_logframe(current_user, logframe.id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to edit this logframe",
        )

    # Create indicator from template
    order = await next_order(db, Indicator, result_id=body.result_id)
    indicator = Indicator(
        name=lib.name,
        description=lib.definition,
        source_of_verification=lib.data_source,
        measurement_type=lib.measurement_type,
        unit=lib.unit_of_measure,
        result_id=body.result_id,
        order=order,
        library_indicator_id=lib.id,
    )
    db.add(indicator)
    await db.commit()
    await db.refresh(indicator)

    # Auto-create default SubIndicator (matches existing pattern)
    default_sub = SubIndicator(name="", order=1, indicator_id=indicator.id)
    db.add(default_sub)
    await db.commit()

    return indicator
