"""Resolve public_id (UUID) path parameters to internal integer IDs.

All URL-facing endpoints use public_id (UUID) for security.
Internal foreign keys still use integer IDs for performance.
These helpers bridge the two.
"""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logframe import Logframe
from app.models.org import Organisation, Program, Project


async def resolve_org(public_id: UUID, db: AsyncSession) -> Organisation:
    """Look up an Organisation by public_id or raise 404."""
    result = await db.execute(
        select(Organisation).where(Organisation.public_id == public_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return obj


async def resolve_program(public_id: UUID, db: AsyncSession) -> Program:
    """Look up a Program by public_id or raise 404."""
    result = await db.execute(
        select(Program).where(Program.public_id == public_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Program not found")
    return obj


async def resolve_project(public_id: UUID, db: AsyncSession) -> Project:
    """Look up a Project by public_id or raise 404."""
    result = await db.execute(
        select(Project).where(Project.public_id == public_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Project not found")
    return obj


async def resolve_logframe(public_id: UUID, db: AsyncSession) -> Logframe:
    """Look up a Logframe by public_id or raise 404."""
    result = await db.execute(
        select(Logframe).where(Logframe.public_id == public_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Logframe not found")
    return obj
