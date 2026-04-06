"""Google Sheets integration API endpoints.

Manages connections, column mappings, and sync operations between
Google Sheets and Chauka indicator data.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.gsheets import (
    GoogleSheetsColumnMapping,
    GoogleSheetsConnection,
    GoogleSheetsSyncLog,
)
from app.schemas.gsheets import (
    GoogleSheetsColumnInfo,
    GoogleSheetsColumnMappingCreate,
    GoogleSheetsColumnMappingRead,
    GoogleSheetsColumnMappingUpdate,
    GoogleSheetsConnectionCreate,
    GoogleSheetsConnectionRead,
    GoogleSheetsConnectionUpdate,
    GoogleSheetsSheetInfo,
    GoogleSheetsSyncLogRead,
)
from app.services.gsheets import GoogleSheetsClient, sync_gsheets_connection
from app.services.resolve import resolve_logframe

router = APIRouter(
    prefix="/api/logframes/{logframe_public_id}/gsheets",
    tags=["google-sheets-integration"],
)


# --- Connection management ---


@router.get("/connection", response_model=GoogleSheetsConnectionRead | None)
async def get_connection(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Get the Google Sheets connection for this logframe (if any)."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
    )
    return result.scalar_one_or_none()


@router.post("/connection", response_model=GoogleSheetsConnectionRead, status_code=201)
async def create_connection(
    logframe_public_id: UUID,
    body: GoogleSheetsConnectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Create a Google Sheets connection for this logframe."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    existing = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Connection already exists for this logframe"
        )
    obj = GoogleSheetsConnection(logframe_id=logframe_id, **body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/connection", response_model=GoogleSheetsConnectionRead)
async def update_connection(
    logframe_public_id: UUID,
    body: GoogleSheetsConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Update the Google Sheets connection settings."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
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
    """Remove the Google Sheets connection and all mappings."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="No connection found")
    await db.delete(obj)
    await db.commit()


# --- Sheet discovery ---


@router.get("/sheets", response_model=list[GoogleSheetsSheetInfo])
async def list_sheets(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List sheets (tabs) in the connected spreadsheet."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id,
            GoogleSheetsConnection.is_active == True,  # noqa: E712
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection")
    client = GoogleSheetsClient(conn.service_account_json)
    return client.list_sheets(conn.spreadsheet_id)


@router.get("/columns", response_model=list[GoogleSheetsColumnInfo])
async def list_columns(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List column headers from the connected sheet's first row."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id,
            GoogleSheetsConnection.is_active == True,  # noqa: E712
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection")
    client = GoogleSheetsClient(conn.service_account_json)
    sheet_name = conn.sheet_name or "Sheet1"
    return client.get_headers(conn.spreadsheet_id, sheet_name)


# --- Column mappings ---


@router.get("/mappings", response_model=list[GoogleSheetsColumnMappingRead])
async def list_mappings(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List all column mappings for this logframe's connection."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        return []
    mappings = await db.execute(
        select(GoogleSheetsColumnMapping).where(
            GoogleSheetsColumnMapping.connection_id == conn.id
        )
    )
    return mappings.scalars().all()


@router.post("/mappings", response_model=GoogleSheetsColumnMappingRead, status_code=201)
async def create_mapping(
    logframe_public_id: UUID,
    body: GoogleSheetsColumnMappingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Create a new column mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No connection found")
    obj = GoogleSheetsColumnMapping(connection_id=conn.id, **body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/mappings/{mapping_id}", response_model=GoogleSheetsColumnMappingRead)
async def update_mapping(
    logframe_public_id: UUID,
    mapping_id: int,
    body: GoogleSheetsColumnMappingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Update a column mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsColumnMapping).where(
            GoogleSheetsColumnMapping.id == mapping_id
        )
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
    """Delete a column mapping."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsColumnMapping).where(
            GoogleSheetsColumnMapping.id == mapping_id
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Mapping not found")
    await db.delete(obj)
    await db.commit()


# --- Sync operations ---


@router.post("/sync", response_model=GoogleSheetsSyncLogRead)
async def trigger_sync(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """Trigger a sync from Google Sheets for this logframe."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id,
            GoogleSheetsConnection.is_active == True,  # noqa: E712
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection")
    log = await sync_gsheets_connection(conn, db)
    return log


@router.get("/sync/logs", response_model=list[GoogleSheetsSyncLogRead])
async def list_sync_logs(
    logframe_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    """List recent sync logs for this logframe."""
    logframe_id = (await resolve_logframe(logframe_public_id, db)).id
    result = await db.execute(
        select(GoogleSheetsConnection).where(
            GoogleSheetsConnection.logframe_id == logframe_id
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        return []
    logs = await db.execute(
        select(GoogleSheetsSyncLog)
        .where(GoogleSheetsSyncLog.connection_id == conn.id)
        .order_by(GoogleSheetsSyncLog.synced_at.desc())
        .limit(20)
    )
    return logs.scalars().all()
