from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_org_admin
from app.database import get_db
from app.models.contacts import User
from app.models.org import Invitation, Organisation, OrganisationMembership, OrgRole

router = APIRouter(tags=["invitations"])


# --- Schemas ---

class InvitationCreate(BaseModel):
    email: str
    role: str = "member"


class InvitationRead(BaseModel):
    id: int
    organisation_id: int
    email: str
    role: str
    token: str
    created_by: int
    accepted: bool

    class Config:
        from_attributes = True


class InvitationPublic(BaseModel):
    """Public info shown to someone viewing an invite link (no auth required)."""
    organisation_name: str
    email: str
    role: str
    accepted: bool


# --- Organisation-scoped endpoints (require auth) ---

@router.get(
    "/api/organisations/{organisation_id}/invitations/",
    response_model=list[InvitationRead],
)
async def list_invitations(
    organisation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """List pending and accepted invitations for an organisation. Requires org admin."""
    result = await db.execute(
        select(Invitation)
        .where(Invitation.organisation_id == organisation_id)
        .order_by(Invitation.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/api/organisations/{organisation_id}/invitations/",
    response_model=InvitationRead,
    status_code=201,
)
async def create_invitation(
    organisation_id: int,
    body: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Create an invitation to join the organisation. Requires org admin."""
    # Verify org exists
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    if not org_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organisation not found")

    # Check for existing pending invite with same email
    existing = await db.execute(
        select(Invitation).where(
            Invitation.organisation_id == organisation_id,
            Invitation.email == body.email,
            Invitation.accepted == False,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Pending invitation already exists for this email")

    role = OrgRole.admin if body.role == "admin" else OrgRole.member
    obj = Invitation(
        organisation_id=organisation_id,
        email=body.email,
        role=role,
        created_by=current_user.id,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete(
    "/api/organisations/{organisation_id}/invitations/{invitation_id}",
    status_code=204,
)
async def revoke_invitation(
    organisation_id: int,
    invitation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Revoke a pending invitation. Requires org admin."""
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.organisation_id == organisation_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if obj.accepted:
        raise HTTPException(status_code=400, detail="Cannot revoke an accepted invitation")
    await db.delete(obj)
    await db.commit()


# --- Public invite endpoints (token-based) ---

@router.get("/api/invitations/{token}", response_model=InvitationPublic)
async def get_invitation_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Validate an invitation token and return public info. No auth required."""
    result = await db.execute(
        select(Invitation).where(Invitation.token == token)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or expired")

    org_result = await db.execute(
        select(Organisation).where(Organisation.id == invite.organisation_id)
    )
    org = org_result.scalar_one_or_none()

    return InvitationPublic(
        organisation_name=org.name if org else "Unknown",
        email=invite.email,
        role=invite.role.value if hasattr(invite.role, 'value') else str(invite.role),
        accepted=invite.accepted,
    )


@router.post("/api/invitations/{token}/accept")
async def accept_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept an invitation. Creates org membership for the authenticated user."""
    result = await db.execute(
        select(Invitation).where(Invitation.token == token)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or expired")
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Invitation already accepted")

    # Check if user is already a member
    existing = await db.execute(
        select(OrganisationMembership).where(
            OrganisationMembership.user_id == current_user.id,
            OrganisationMembership.organisation_id == invite.organisation_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You are already a member of this organisation")

    # Create membership
    membership = OrganisationMembership(
        user_id=current_user.id,
        organisation_id=invite.organisation_id,
        role=invite.role,
    )
    db.add(membership)

    # Mark invite as accepted
    invite.accepted = True
    invite.accepted_by = current_user.id

    await db.commit()
    return {"status": "ok", "organisation_id": invite.organisation_id}
