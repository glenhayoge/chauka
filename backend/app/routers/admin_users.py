"""Admin user management endpoints."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_superuser
from app.auth.utils import get_password_hash
from app.database import get_db
from app.models.contacts import User
from app.models.org import OrganisationMembership
from app.schemas.admin import AdminUserCreate, AdminUserRead, AdminUserUpdate, PaginatedUsers
from app.services.audit import log_change

router = APIRouter(
    prefix="/api/admin/users",
    tags=["admin-users"],
)

PASSWORD_RESET_EXPIRY_HOURS = 24


async def _user_to_read(user: User, db: AsyncSession) -> dict:
    """Convert a User model to AdminUserRead-compatible dict with org_count."""
    oc = (
        await db.execute(
            select(func.count(OrganisationMembership.id)).where(
                OrganisationMembership.user_id == user.id
            )
        )
    ).scalar() or 0
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email or "",
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_active": user.is_active,
        "date_joined": user.date_joined,
        "last_login": user.last_login,
        "org_count": oc,
    }


@router.get("/", response_model=PaginatedUsers)
async def list_users(
    search: str | None = None,
    is_active: bool | None = None,
    sort: str = Query(default="date_joined", regex="^(username|date_joined|last_login|email)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all users with search, filter, sort, and pagination."""
    base = select(User)
    count_base = select(func.count(User.id))

    if search:
        term = f"%{search}%"
        search_filter = or_(
            User.username.ilike(term),
            User.email.ilike(term),
            User.first_name.ilike(term),
            User.last_name.ilike(term),
        )
        base = base.where(search_filter)
        count_base = count_base.where(search_filter)

    if is_active is not None:
        base = base.where(User.is_active == is_active)
        count_base = count_base.where(User.is_active == is_active)

    total = (await db.execute(count_base)).scalar() or 0

    sort_col = getattr(User, sort, User.date_joined)
    base = base.order_by(desc(sort_col)).offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base)
    users = result.scalars().all()

    items = [await _user_to_read(u, db) for u in users]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{user_id}", response_model=AdminUserRead)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Get a single user's details."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await _user_to_read(user, db)


@router.post("/", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Create a new user (admin-created)."""
    # Check uniqueness
    existing = await db.execute(
        select(User).where(or_(User.username == body.username, User.email == body.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        username=body.username,
        email=body.email,
        password=get_password_hash(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        is_staff=body.is_staff,
        is_superuser=body.is_superuser,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log_change(db, current_user.id, "create", "user", user.id, {"username": user.username})
    await db.commit()

    return await _user_to_read(user, db)


@router.patch("/{user_id}", response_model=AdminUserRead)
async def update_user(
    user_id: int,
    body: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Update a user's fields."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = {}
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_val = getattr(user, field)
        if old_val != value:
            changes[field] = {"old": old_val, "new": value}
            setattr(user, field, value)

    if changes:
        await log_change(db, current_user.id, "update", "user", user.id, changes)
    await db.commit()
    await db.refresh(user)

    return await _user_to_read(user, db)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Soft-delete a user by setting is_active=False."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = False
    await log_change(db, current_user.id, "delete", "user", user.id, {"deactivated": True})
    await db.commit()


@router.post("/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Admin-initiated password reset: generate a reset token and return the link."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_EXPIRY_HOURS)

    user.password_reset_token = token
    user.password_reset_expires = expires.isoformat()

    await log_change(db, current_user.id, "update", "user", user.id, {"admin_password_reset": True})
    await db.commit()

    origin = request.headers.get("origin", "")
    reset_link = f"{origin}/reset-password/{token}"

    return {"message": f"Password reset link generated for {user.username}", "reset_link": reset_link}
