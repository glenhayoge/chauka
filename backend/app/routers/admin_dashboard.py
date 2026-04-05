"""Admin portal dashboard and platform-wide audit log."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_superuser
from app.database import get_db
from app.models.audit import AuditLog
from app.models.contacts import User
from app.schemas.admin import AuditEntryRead, PlatformDashboardRead
from app.services.admin_dashboard import get_platform_dashboard

router = APIRouter(
    prefix="/api/admin/dashboard",
    tags=["admin-dashboard"],
)


@router.get("/", response_model=PlatformDashboardRead)
async def platform_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Platform-wide dashboard metrics for admin portal."""
    data = await get_platform_dashboard(db)
    return data


@router.get("/audit-log", response_model=list[AuditEntryRead])
async def platform_audit_log(
    entity_type: str | None = None,
    action: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Platform-wide audit log (not scoped to a logframe)."""
    stmt = (
        select(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.timestamp))
    )
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return [
        {
            "id": entry.id,
            "user_id": entry.user_id,
            "username": username,
            "action": entry.action,
            "entity_type": entry.entity_type,
            "entity_id": entry.entity_id,
            "changes": entry.changes or "{}",
            "logframe_id": entry.logframe_id,
            "timestamp": entry.timestamp,
        }
        for entry, username in result.all()
    ]
