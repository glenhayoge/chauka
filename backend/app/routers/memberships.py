from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_org_admin, require_org_member
from app.database import get_db
from app.models.contacts import User
from app.models.org import Organisation, OrganisationMembership, OrgRole
from app.schemas.org import MembershipCreate, MembershipRead

router = APIRouter(
    prefix="/api/organisations/{organisation_id}/members",
    tags=["memberships"],
)


@router.get("/", response_model=list[MembershipRead])
async def list_members(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_member),
):
    """List all members of an organisation. Requires org membership."""
    org = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    if not org.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organisation not found")

    result = await db.execute(
        select(OrganisationMembership)
        .where(OrganisationMembership.organisation_id == organisation_id)
        .order_by(OrganisationMembership.created_at)
    )
    return result.scalars().all()


@router.post("/", response_model=MembershipRead, status_code=201)
async def add_member(
    organisation_id: int,
    body: MembershipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Add a user to the organisation. Requires org admin."""
    # Validate role value
    try:
        role = OrgRole(body.role)
    except ValueError:
        raise HTTPException(
            status_code=422, detail=f"Invalid role: {body.role}. Must be 'admin' or 'member'."
        )

    # Verify target user exists
    user_result = await db.execute(
        select(User).where(User.id == body.user_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing membership
    existing = await db.execute(
        select(OrganisationMembership).where(
            OrganisationMembership.user_id == body.user_id,
            OrganisationMembership.organisation_id == organisation_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User is already a member of this organisation")

    membership = OrganisationMembership(
        user_id=body.user_id,
        organisation_id=organisation_id,
        role=role,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


@router.patch("/{membership_id}", response_model=MembershipRead)
async def update_member_role(
    organisation_id: int,
    membership_id: int,
    body: MembershipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Update a membership role. Requires org admin."""
    try:
        role = OrgRole(body.role)
    except ValueError:
        raise HTTPException(
            status_code=422, detail=f"Invalid role: {body.role}. Must be 'admin' or 'member'."
        )

    result = await db.execute(
        select(OrganisationMembership).where(
            OrganisationMembership.id == membership_id,
            OrganisationMembership.organisation_id == organisation_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    membership.role = role
    await db.commit()
    await db.refresh(membership)
    return membership


@router.delete("/{membership_id}", status_code=204)
async def remove_member(
    organisation_id: int,
    membership_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Remove a member from the organisation. Requires org admin."""
    result = await db.execute(
        select(OrganisationMembership).where(
            OrganisationMembership.id == membership_id,
            OrganisationMembership.organisation_id == organisation_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    await db.delete(membership)
    await db.commit()
