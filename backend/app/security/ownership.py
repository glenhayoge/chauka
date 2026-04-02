"""
IDOR (Insecure Direct Object Reference) protection helpers.
Validate that nested resources belong to the requested logframe.
"""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logframe import Activity, Indicator, Result


async def verify_result_ownership(
    result_id: int, logframe_id: int, db: AsyncSession
) -> None:
    stmt = select(Result.id).where(
        Result.id == result_id,
        Result.logframe_id == logframe_id,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found in this logframe.",
        )


async def verify_indicator_ownership(
    indicator_id: int, result_id: int, db: AsyncSession
) -> None:
    stmt = select(Indicator.id).where(
        Indicator.id == indicator_id,
        Indicator.result_id == result_id,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Indicator not found in this result.",
        )


async def verify_activity_ownership(
    activity_id: int, result_id: int, db: AsyncSession
) -> None:
    stmt = select(Activity.id).where(
        Activity.id == activity_id,
        Activity.result_id == result_id,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found in this result.",
        )
