"""Analytics endpoints for disaggregation breakdowns and contribution analysis."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.contacts import User
from app.services.disaggregation import get_disaggregation_breakdown

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/analytics",
    tags=["analytics"],
)


@router.get("/disaggregation")
async def disaggregation_breakdown(
    logframe_id: int,
    category_id: int = Query(...),
    column_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get disaggregation breakdown for a category, optionally filtered by column."""
    return await get_disaggregation_breakdown(logframe_id, category_id, column_id, db)


@router.get("/contribution")
async def contribution_analysis(
    logframe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get contribution analysis scores for the logframe."""
    from app.services.bootstrap import get_bootstrap_data

    # Reuse bootstrap to get all data, then compute contribution
    bootstrap = await get_bootstrap_data(logframe_id, db, current_user)
    if not bootstrap:
        return {"scores": []}

    return {"scores": bootstrap.get("contributionScores", [])}
