"""Auto-ordering helpers matching Django's MAX+1 pattern."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def next_order(db: AsyncSession, model, **filter_kwargs) -> int:
    """Return MAX(order)+1 for a given parent filter."""
    stmt = select(func.max(model.order))
    for col, val in filter_kwargs.items():
        stmt = stmt.where(getattr(model, col) == val)
    result = await db.execute(stmt)
    max_order = result.scalar_one_or_none()
    return (max_order or 0) + 1


async def auto_level(db: AsyncSession, model, logframe_id: int, parent_id: int | None = None) -> int:
    """Return the appropriate level for a new result.

    If parent_id is given, returns parent.level + 1.
    Otherwise returns 1 (top-level default).
    """
    if parent_id is not None:
        stmt = select(model.level).where(model.id == parent_id)
        result = await db.execute(stmt)
        parent_level = result.scalar_one_or_none()
        return (parent_level or 0) + 1
    return 1
