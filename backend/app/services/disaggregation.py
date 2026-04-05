"""Disaggregation analysis service — groups indicator data by category values."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logframe import (
    Column,
    DataEntry,
    DisaggregationCategory,
    Indicator,
    SubIndicator,
)


def _parse_numeric(value: str | None) -> float | None:
    """Try to parse a string value as a number, return None if not numeric."""
    if not value:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


async def get_disaggregation_breakdown(
    logframe_id: int,
    category_id: int,
    column_id: int | None,
    db: AsyncSession,
) -> dict:
    """Aggregate DataEntry values grouped by disaggregation_value for a category.

    Returns:
        {
            "category": "Gender",
            "column_id": 5 | null,
            "groups": [
                {"value": "Female", "total": 245.0, "count": 5, "average": 49.0},
                {"value": "Male", "total": 220.0, "count": 5, "average": 44.0},
            ]
        }
    """
    # Get the category
    cat_result = await db.execute(
        select(DisaggregationCategory).where(
            DisaggregationCategory.id == category_id,
            DisaggregationCategory.logframe_id == logframe_id,
        )
    )
    category = cat_result.scalar_one_or_none()
    if not category:
        return {"category": "", "column_id": column_id, "groups": []}

    # Get all subindicators tagged with this category
    stmt = (
        select(SubIndicator)
        .where(SubIndicator.disaggregation_category_id == category_id)
    )
    sub_result = await db.execute(stmt)
    subindicators = sub_result.scalars().all()

    if not subindicators:
        return {"category": category.name, "column_id": column_id, "groups": []}

    sub_ids = {s.id for s in subindicators}

    # Get data entries for these subindicators
    de_stmt = select(DataEntry).where(DataEntry.subindicator_id.in_(sub_ids))
    if column_id is not None:
        de_stmt = de_stmt.where(DataEntry.column_id == column_id)
    de_result = await db.execute(de_stmt)
    data_entries = de_result.scalars().all()

    # Build lookup: subindicator_id -> disaggregation_value
    sub_to_value = {s.id: s.disaggregation_value or "Unknown" for s in subindicators}

    # Aggregate by disaggregation_value
    groups: dict[str, dict] = {}
    for de in data_entries:
        value = sub_to_value.get(de.subindicator_id, "Unknown")
        num = _parse_numeric(de.data)
        if num is None:
            continue

        if value not in groups:
            groups[value] = {"value": value, "total": 0.0, "count": 0}
        groups[value]["total"] += num
        groups[value]["count"] += 1

    # Compute averages
    for g in groups.values():
        g["average"] = round(g["total"] / g["count"], 2) if g["count"] > 0 else 0.0
        g["total"] = round(g["total"], 2)

    return {
        "category": category.name,
        "column_id": column_id,
        "groups": sorted(groups.values(), key=lambda x: x["value"]),
    }
