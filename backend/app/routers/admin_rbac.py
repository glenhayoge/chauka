"""Admin RBAC management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_superuser
from app.database import get_db
from app.models.contacts import User
from app.models.permission import Permission, RolePermission
from app.schemas.admin import PermissionCreate, PermissionRead, RolePermissionSummary

router = APIRouter(
    prefix="/api/admin/rbac",
    tags=["admin-rbac"],
)

# The system's known roles (matching existing RBAC hierarchy)
KNOWN_ROLES = ["org_admin", "project_lead", "data_collector", "viewer"]


@router.get("/roles", response_model=list[RolePermissionSummary])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all role types with their assigned permissions."""
    result = []
    for role in KNOWN_ROLES:
        rp_rows = await db.execute(
            select(Permission.codename)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role == role)
            .order_by(Permission.codename)
        )
        codenames = [row[0] for row in rp_rows.all()]
        result.append({"role": role, "permissions": codenames})
    return result


@router.get("/permissions", response_model=list[PermissionRead])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all defined permissions."""
    result = await db.execute(
        select(Permission).order_by(Permission.category, Permission.codename)
    )
    return result.scalars().all()


@router.post("/permissions", response_model=PermissionRead, status_code=status.HTTP_201_CREATED)
async def create_permission(
    body: PermissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Create a new permission definition."""
    existing = await db.execute(
        select(Permission).where(Permission.codename == body.codename)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Permission codename already exists")

    perm = Permission(
        codename=body.codename,
        name=body.name,
        description=body.description,
        category=body.category,
    )
    db.add(perm)
    await db.commit()
    await db.refresh(perm)
    return perm


@router.put("/roles/{role}/permissions", response_model=RolePermissionSummary)
async def set_role_permissions(
    role: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Set the permissions for a given role (replaces all existing)."""
    if role not in KNOWN_ROLES:
        raise HTTPException(status_code=400, detail=f"Unknown role: {role}")

    permission_codenames: list[str] = body.get("permissions", [])

    # Validate all codenames exist
    if permission_codenames:
        existing = await db.execute(
            select(Permission).where(Permission.codename.in_(permission_codenames))
        )
        found = {p.codename: p.id for p in existing.scalars().all()}
        missing = set(permission_codenames) - set(found.keys())
        if missing:
            raise HTTPException(status_code=400, detail=f"Unknown permissions: {', '.join(missing)}")
    else:
        found = {}

    # Remove existing role permissions
    await db.execute(
        delete(RolePermission).where(RolePermission.role == role)
    )

    # Add new ones
    for codename, perm_id in found.items():
        db.add(RolePermission(role=role, permission_id=perm_id))

    await db.commit()

    return {"role": role, "permissions": list(found.keys())}
