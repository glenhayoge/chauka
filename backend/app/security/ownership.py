"""
IDOR (Insecure Direct Object Reference) protection helpers.
Validate that nested resources belong to the requested logframe.
"""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logframe import (
    Activity,
    BudgetLine,
    DataEntry,
    Expense,
    Indicator,
    Milestone,
    Result,
    StatusUpdate,
    SubIndicator,
    TALine,
    Target,
)


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


async def verify_subindicator_ownership(
    subindicator_id: int, indicator_id: int, db: AsyncSession
) -> None:
    stmt = select(SubIndicator.id).where(
        SubIndicator.id == subindicator_id,
        SubIndicator.indicator_id == indicator_id,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SubIndicator not found in this indicator.",
        )


async def verify_budget_line_ownership(
    budget_line_id: int, activity_id: int, db: AsyncSession
) -> None:
    stmt = select(BudgetLine.id).where(
        BudgetLine.id == budget_line_id,
        BudgetLine.activity_id == activity_id,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BudgetLine not found in this activity.",
        )


async def verify_milestone_ownership(
    milestone_id: int, activity_id: int, db: AsyncSession
) -> None:
    stmt = select(Milestone.id).where(
        Milestone.id == milestone_id,
        Milestone.activity_id == activity_id,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found in this activity.",
        )


async def verify_taline_belongs_to_logframe(
    ta_line_id: int, logframe_id: int, db: AsyncSession
) -> None:
    stmt = (
        select(TALine.id)
        .join(Activity, TALine.activity_id == Activity.id)
        .join(Result, Activity.result_id == Result.id)
        .where(TALine.id == ta_line_id, Result.logframe_id == logframe_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TALine not found in this logframe.",
        )


async def verify_statusupdate_belongs_to_logframe(
    status_update_id: int, logframe_id: int, db: AsyncSession
) -> None:
    stmt = (
        select(StatusUpdate.id)
        .join(Activity, StatusUpdate.activity_id == Activity.id)
        .join(Result, Activity.result_id == Result.id)
        .where(StatusUpdate.id == status_update_id, Result.logframe_id == logframe_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="StatusUpdate not found in this logframe.",
        )


async def verify_dataentry_belongs_to_logframe(
    entry_id: int, logframe_id: int, db: AsyncSession
) -> None:
    stmt = (
        select(DataEntry.id)
        .join(SubIndicator, DataEntry.subindicator_id == SubIndicator.id)
        .join(Indicator, SubIndicator.indicator_id == Indicator.id)
        .join(Result, Indicator.result_id == Result.id)
        .where(DataEntry.id == entry_id, Result.logframe_id == logframe_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DataEntry not found in this logframe.",
        )


async def verify_target_belongs_to_logframe(
    target_id: int, logframe_id: int, db: AsyncSession
) -> None:
    stmt = (
        select(Target.id)
        .join(SubIndicator, Target.subindicator_id == SubIndicator.id)
        .join(Indicator, SubIndicator.indicator_id == Indicator.id)
        .join(Result, Indicator.result_id == Result.id)
        .where(Target.id == target_id, Result.logframe_id == logframe_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target not found in this logframe.",
        )


async def verify_expense_belongs_to_logframe(
    expense_id: int, logframe_id: int, db: AsyncSession
) -> None:
    stmt = (
        select(Expense.id)
        .join(BudgetLine, Expense.budget_line_id == BudgetLine.id)
        .join(Activity, BudgetLine.activity_id == Activity.id)
        .join(Result, Activity.result_id == Result.id)
        .where(Expense.id == expense_id, Result.logframe_id == logframe_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found in this logframe.",
        )
