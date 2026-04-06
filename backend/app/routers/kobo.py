"""KoboToolBox integration API endpoints.

Manages connections, field mappings, and sync operations between
KoboToolBox forms and Chauka indicator data.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.kobo import KoboConnection, KoboFieldMapping, KoboSyncLog
from app.schemas.kobo import (
    KoboConnectionCreate,
    KoboConnectionRead,
    KoboConnectionUpdate,
    KoboFieldMappingCreate,
    KoboFieldMappingRead,
    KoboFieldMappingUpdate,
    KoboFormSummary,
    KoboSyncLogRead,
)
from app.services.kobo import KoboClient, sync_connection
from app.services.resolve import resolve_logframe

router = APIRouter(
    prefix="/api/logframes/{logframe_public_id}/kobo",
    tags=["kobo-integration"],
)


# --- Connection management ---


@router.get("/connection", response_model=KoboConnectionRead | None)
async def get_connection(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Get the KoboToolBox connection for this logframe (if any)."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    return result.scalar_one_or_none()


@router.post("/connection", response_model=KoboConnectionRead, status_code=201)
async def create_connection(
    logframe_public_id: UUID,
    body: KoboConnectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Create a KoboToolBox connection for this logframe."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    # Only one connection per logframe
    existing = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Connection already exists for this logframe")
    obj = KoboConnection(logframe_id=logframe_id, **body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/connection", response_model=KoboConnectionRead)
async def update_connection(
    logframe_public_id: UUID,
    body: KoboConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Update the KoboToolBox connection settings."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="No connection found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/connection", status_code=204)
async def delete_connection(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Remove the KoboToolBox connection and all mappings."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="No connection found")
    await db.delete(obj)
    await db.commit()


# --- Form discovery ---


@router.get("/forms", response_model=list[KoboFormSummary])
async def list_forms(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List available KoboToolBox forms using the stored connection."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(
            KoboConnection.logframe_id == logframe_id,
            KoboConnection.is_active == True,  # noqa: E712
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection")
    client = KoboClient(conn.server_url, conn.api_token)
    forms = await client.list_forms()
    return [
        KoboFormSummary(
            uid=f.get("uid", ""),
            name=f.get("name", ""),
            deployment_status=f.get("deployment_status"),
            submission_count=f.get("deployment__submission_count"),
        )
        for f in forms
    ]


@router.get("/forms/{form_uid}/fields")
async def list_form_fields(
    logframe_public_id: UUID,
    form_uid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List questions/fields in a KoboToolBox form for mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(
            KoboConnection.logframe_id == logframe_id,
            KoboConnection.is_active == True,  # noqa: E712
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection")
    client = KoboClient(conn.server_url, conn.api_token)
    fields = await client.get_form_fields(form_uid)
    return [
        {
            "name": f.get("$autoname") or f.get("name", ""),
            "label": (f.get("label", [None]) or [None])[0] or f.get("name", ""),
            "type": f.get("type", ""),
        }
        for f in fields
        if f.get("type") not in ("begin_group", "end_group", "note", "begin_repeat", "end_repeat")
    ]


# --- Field mappings ---


@router.get("/mappings", response_model=list[KoboFieldMappingRead])
async def list_mappings(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List all field mappings for this logframe's connection."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        return []
    mappings = await db.execute(
        select(KoboFieldMapping).where(KoboFieldMapping.connection_id == conn.id)
    )
    return mappings.scalars().all()


@router.post("/mappings", response_model=KoboFieldMappingRead, status_code=201)
async def create_mapping(
    logframe_public_id: UUID,
    body: KoboFieldMappingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Create a new field mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No connection found")
    obj = KoboFieldMapping(connection_id=conn.id, **body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/mappings/{mapping_id}", response_model=KoboFieldMappingRead)
async def update_mapping(
    logframe_public_id: UUID,
    mapping_id: int,
    body: KoboFieldMappingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Update a field mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboFieldMapping).where(KoboFieldMapping.id == mapping_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Mapping not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/mappings/{mapping_id}", status_code=204)
async def delete_mapping(
    logframe_public_id: UUID,
    mapping_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Delete a field mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboFieldMapping).where(KoboFieldMapping.id == mapping_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Mapping not found")
    await db.delete(obj)
    await db.commit()


# --- Sync operations ---


@router.post("/sync", response_model=KoboSyncLogRead)
async def trigger_sync(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Trigger a sync from KoboToolBox for this logframe."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(
            KoboConnection.logframe_id == logframe_id,
            KoboConnection.is_active == True,  # noqa: E712
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection")
    log = await sync_connection(conn, db)
    return log


@router.get("/sync/logs", response_model=list[KoboSyncLogRead])
async def list_sync_logs(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List recent sync logs for this logframe."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(KoboConnection).where(KoboConnection.logframe_id == logframe_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        return []
    logs = await db.execute(
        select(KoboSyncLog)
        .where(KoboSyncLog.connection_id == conn.id)
        .order_by(KoboSyncLog.synced_at.desc())
        .limit(20)
    )
    return logs.scalars().all()
