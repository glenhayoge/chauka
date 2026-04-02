from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.audit import AuditLog
from app.models.contacts import User
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/audit-log",
    tags=["audit"],
)


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: int
    changes: str
    logframe_id: int | None
    timestamp: datetime | None


@router.get("/", response_model=list[AuditLogRead])
async def list_audit_logs(
    logframe_id: int,
    entity_type: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.logframe_id == logframe_id)
        .order_by(desc(AuditLog.timestamp))
    )
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
