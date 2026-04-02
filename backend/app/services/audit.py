"""Audit logging utility for tracking changes."""

import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


async def log_change(
    db: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    changes: dict | None = None,
    logframe_id: int | None = None,
) -> None:
    """Record a change in the audit log."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=json.dumps(changes) if changes else "{}",
        logframe_id=logframe_id,
    )
    db.add(entry)
