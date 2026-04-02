from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_org_admin
from app.database import get_db
from app.models.contacts import User
from app.models.org import Program, Project, ProjectRole, ProjectRoleType
from app.schemas.org import ProjectRoleCreate, ProjectRoleRead

router = APIRouter(
    prefix="/api/organisations/{organisation_id}/programs/{program_id}/projects/{project_id}/roles",
    tags=["project-roles"],
)


async def _get_project(
    organisation_id: int, program_id: int, project_id: int, db: AsyncSession
) -> Project:
    """Verify the project exists within the correct org/program hierarchy."""
    prog_result = await db.execute(
        select(Program).where(
            Program.id == program_id,
            Program.organisation_id == organisation_id,
        )
    )
    if not prog_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Program not found")

    proj_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.program_id == program_id,
        )
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=list[ProjectRoleRead])
async def list_project_roles(
    organisation_id: int,
    program_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all role assignments for a project."""
    await _get_project(organisation_id, program_id, project_id, db)

    result = await db.execute(
        select(ProjectRole)
        .where(ProjectRole.project_id == project_id)
        .order_by(ProjectRole.created_at)
    )
    return result.scalars().all()


@router.post("/", response_model=ProjectRoleRead, status_code=201)
async def assign_project_role(
    organisation_id: int,
    program_id: int,
    project_id: int,
    body: ProjectRoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Assign a role to a user on a project. Requires org admin."""
    await _get_project(organisation_id, program_id, project_id, db)

    try:
        role = ProjectRoleType(body.role)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid role: {body.role}. Must be 'lead', 'collector', or 'viewer'.",
        )

    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == body.user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing role
    existing = await db.execute(
        select(ProjectRole).where(
            ProjectRole.user_id == body.user_id,
            ProjectRole.project_id == project_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already has a role on this project")

    pr = ProjectRole(
        user_id=body.user_id,
        project_id=project_id,
        role=role,
    )
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return pr


@router.patch("/{role_id}", response_model=ProjectRoleRead)
async def update_project_role(
    organisation_id: int,
    program_id: int,
    project_id: int,
    role_id: int,
    body: ProjectRoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Update a project role assignment. Requires org admin."""
    await _get_project(organisation_id, program_id, project_id, db)

    try:
        role = ProjectRoleType(body.role)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid role: {body.role}. Must be 'lead', 'collector', or 'viewer'.",
        )

    result = await db.execute(
        select(ProjectRole).where(
            ProjectRole.id == role_id,
            ProjectRole.project_id == project_id,
        )
    )
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Project role not found")

    pr.role = role
    await db.commit()
    await db.refresh(pr)
    return pr


@router.delete("/{role_id}", status_code=204)
async def remove_project_role(
    organisation_id: int,
    program_id: int,
    project_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_org_admin),
):
    """Remove a project role assignment. Requires org admin."""
    await _get_project(organisation_id, program_id, project_id, db)

    result = await db.execute(
        select(ProjectRole).where(
            ProjectRole.id == role_id,
            ProjectRole.project_id == project_id,
        )
    )
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Project role not found")

    await db.delete(pr)
    await db.commit()
