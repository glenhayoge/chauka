"""Admin organisation management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_superuser
from app.database import get_db
from app.models.contacts import User
from app.models.org import Organisation, OrganisationMembership, Program, Project
from app.models.logframe import Logframe
from app.schemas.admin import AdminOrgRead, PaginatedOrgs
from app.services.audit import log_change

router = APIRouter(
    prefix="/api/admin/organisations",
    tags=["admin-organisations"],
)


async def _org_to_read(org: Organisation, db: AsyncSession) -> dict:
    """Convert an Organisation model to AdminOrgRead-compatible dict."""
    # Owner username
    owner_username = None
    if org.owner_id:
        owner_result = await db.execute(select(User.username).where(User.id == org.owner_id))
        row = owner_result.first()
        if row:
            owner_username = row[0]

    # Member count
    mc = (
        await db.execute(
            select(func.count(OrganisationMembership.id)).where(
                OrganisationMembership.organisation_id == org.id
            )
        )
    ).scalar() or 0

    # Logframe count (via programs -> projects -> logframes)
    prog_ids_q = select(Program.id).where(Program.organisation_id == org.id)
    proj_ids_q = select(Project.id).where(
        or_(
            Project.program_id.in_(prog_ids_q),
            (Project.organisation_id == org.id) & Project.program_id.is_(None),
        )
    )
    lf_count = (
        await db.execute(
            select(func.count(Logframe.id)).where(
                or_(
                    Logframe.project_id.in_(proj_ids_q),
                    Logframe.program_id.in_(prog_ids_q),
                )
            )
        )
    ).scalar() or 0

    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "description": org.description or "",
        "country": org.country or "",
        "org_type": org.org_type or "",
        "sector": org.sector or "",
        "owner_id": org.owner_id,
        "owner_username": owner_username,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "member_count": mc,
        "logframe_count": lf_count,
    }


@router.get("/", response_model=PaginatedOrgs)
async def list_organisations(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all organisations with member/logframe counts."""
    base = select(Organisation)
    count_base = select(func.count(Organisation.id))

    if search:
        term = f"%{search}%"
        search_filter = or_(
            Organisation.name.ilike(term),
            Organisation.slug.ilike(term),
        )
        base = base.where(search_filter)
        count_base = count_base.where(search_filter)

    total = (await db.execute(count_base)).scalar() or 0

    base = base.order_by(Organisation.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(base)
    orgs = result.scalars().all()

    items = [await _org_to_read(o, db) for o in orgs]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{org_id}", response_model=AdminOrgRead)
async def get_organisation(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Get organisation details."""
    result = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return await _org_to_read(org, db)


@router.patch("/{org_id}", response_model=AdminOrgRead)
async def update_organisation(
    org_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Update organisation fields (e.g., transfer ownership)."""
    result = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    allowed_fields = {"name", "slug", "description", "country", "org_type", "sector", "owner_id"}
    changes = {}
    for field, value in body.items():
        if field in allowed_fields:
            old_val = getattr(org, field)
            if old_val != value:
                changes[field] = {"old": old_val, "new": value}
                setattr(org, field, value)

    if changes:
        await log_change(db, current_user.id, "update", "organisation", org.id, changes)
    await db.commit()
    await db.refresh(org)

    return await _org_to_read(org, db)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organisation(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Delete an organisation. Use with caution."""
    result = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    await log_change(db, current_user.id, "delete", "organisation", org.id, {"name": org.name})
    await db.delete(org)
    await db.commit()
