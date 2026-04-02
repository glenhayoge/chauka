"""Role-based access control helpers.

Permission hierarchy (highest to lowest):
  superuser / is_staff  -- legacy global admin
  org admin             -- full access within their organisation
  program manager       -- (future: scoped to program)
  project lead          -- full edit on project's logframes
  data collector        -- enter actuals/expenses on logframe
  viewer                -- read-only

The helpers resolve a user's *effective* role for a given logframe by
traversing: logframe -> project -> program -> organisation -> membership.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.contacts import User
from app.models.logframe import Logframe
from app.models.org import (
    Organisation,
    OrganisationMembership,
    OrgRole,
    Program,
    Project,
    ProjectRole,
    ProjectRoleType,
)

# Ordered from most to least privileged
_EDIT_ROLES = {ProjectRoleType.lead, ProjectRoleType.collector}


async def get_user_project_role(
    user_id: int, project_id: int, db: AsyncSession
) -> ProjectRoleType | None:
    """Return the user's explicit role on a project, or None."""
    result = await db.execute(
        select(ProjectRole).where(
            ProjectRole.user_id == user_id,
            ProjectRole.project_id == project_id,
        )
    )
    pr = result.scalar_one_or_none()
    return pr.role if pr else None


async def is_org_admin(user_id: int, organisation_id: int, db: AsyncSession) -> bool:
    """Check whether the user is an admin of the given organisation."""
    result = await db.execute(
        select(OrganisationMembership).where(
            OrganisationMembership.user_id == user_id,
            OrganisationMembership.organisation_id == organisation_id,
            OrganisationMembership.role == OrgRole.admin,
        )
    )
    return result.scalar_one_or_none() is not None


async def is_org_member(user_id: int, organisation_id: int, db: AsyncSession) -> bool:
    """Check whether the user is any kind of member of the given organisation."""
    result = await db.execute(
        select(OrganisationMembership).where(
            OrganisationMembership.user_id == user_id,
            OrganisationMembership.organisation_id == organisation_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def can_edit_logframe(
    user: User, logframe_id: int, db: AsyncSession
) -> bool:
    """Determine whether a user may edit a specific logframe.

    Resolution order:
    1. superuser or is_staff -> True (backward compat)
    2. logframe has a project -> check project role (lead/collector)
    3. logframe's project belongs to an org -> check org admin
    4. Otherwise -> False
    """
    if user.is_superuser or user.is_staff:
        return True

    lf_result = await db.execute(
        select(Logframe).where(Logframe.id == logframe_id)
    )
    logframe = lf_result.scalar_one_or_none()
    if logframe is None:
        return False

    if logframe.project_id is None:
        # Legacy logframe without project -- only staff can edit
        return False

    # Check project role
    pr = await get_user_project_role(user.id, logframe.project_id, db)
    if pr in _EDIT_ROLES:
        return True

    # Check org admin via project -> program -> organisation
    proj_result = await db.execute(
        select(Project)
        .where(Project.id == logframe.project_id)
        .options(selectinload(Project.program))
    )
    project = proj_result.scalar_one_or_none()
    if project and project.program:
        if await is_org_admin(user.id, project.program.organisation_id, db):
            return True

    return False


async def can_view_logframe(
    user: User, logframe_id: int, db: AsyncSession
) -> bool:
    """Determine whether a user may view a specific logframe.

    Any role (including viewer) grants view access. Org members can also view.
    """
    if user.is_superuser or user.is_staff:
        return True

    lf_result = await db.execute(
        select(Logframe).where(Logframe.id == logframe_id)
    )
    logframe = lf_result.scalar_one_or_none()
    if logframe is None:
        return False

    if logframe.project_id is None:
        return True  # Legacy logframe -- all authenticated users can view

    # Check project role (any role = can view)
    pr = await get_user_project_role(user.id, logframe.project_id, db)
    if pr is not None:
        return True

    # Check org membership
    proj_result = await db.execute(
        select(Project)
        .where(Project.id == logframe.project_id)
        .options(selectinload(Project.program))
    )
    project = proj_result.scalar_one_or_none()
    if project and project.program:
        if await is_org_member(user.id, project.program.organisation_id, db):
            return True

    return False


async def get_effective_role(
    user: User, logframe_id: int, db: AsyncSession
) -> str | None:
    """Return a human-readable effective role string for bootstrap canEdit context.

    Returns one of: 'admin', 'lead', 'collector', 'viewer', or None.
    """
    if user.is_superuser or user.is_staff:
        return "admin"

    lf_result = await db.execute(
        select(Logframe).where(Logframe.id == logframe_id)
    )
    logframe = lf_result.scalar_one_or_none()
    if logframe is None or logframe.project_id is None:
        return None

    # Check org admin
    proj_result = await db.execute(
        select(Project)
        .where(Project.id == logframe.project_id)
        .options(selectinload(Project.program))
    )
    project = proj_result.scalar_one_or_none()
    if project and project.program:
        if await is_org_admin(user.id, project.program.organisation_id, db):
            return "admin"

    # Check project role
    pr = await get_user_project_role(user.id, logframe.project_id, db)
    if pr is not None:
        return pr.value

    return None
