from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import BudgetLine, Milestone
from app.schemas.logframe import (
    BudgetLineCreate, BudgetLineRead, BudgetLineUpdate,
    MilestoneCreate, MilestoneRead,
)

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/results/{result_id}/activities/{activity_id}",
    tags=["budget"],
)


@router.get("/budget-lines/", response_model=list[BudgetLineRead])
async def list_budget_lines(
    logframe_id: int, result_id: int, activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BudgetLine).where(BudgetLine.activity_id == activity_id))
    return result.scalars().all()


@router.post("/budget-lines/", response_model=BudgetLineRead, status_code=201)
async def create_budget_line(
    logframe_id: int, result_id: int, activity_id: int,
    body: BudgetLineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    obj = BudgetLine(**body.model_dump(exclude={"activity_id"}), activity_id=activity_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/budget-lines/{budget_line_id}", response_model=BudgetLineRead)
async def update_budget_line(
    logframe_id: int, result_id: int, activity_id: int, budget_line_id: int,
    body: BudgetLineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(BudgetLine).where(BudgetLine.id == budget_line_id, BudgetLine.activity_id == activity_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="BudgetLine not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/budget-lines/{budget_line_id}", status_code=204)
async def delete_budget_line(
    logframe_id: int, result_id: int, activity_id: int, budget_line_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(BudgetLine).where(BudgetLine.id == budget_line_id, BudgetLine.activity_id == activity_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="BudgetLine not found")
    await db.delete(obj)
    await db.commit()


@router.get("/milestones/", response_model=list[MilestoneRead])
async def list_milestones(
    logframe_id: int, result_id: int, activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Milestone).where(Milestone.activity_id == activity_id))
    return result.scalars().all()


@router.post("/milestones/", response_model=MilestoneRead, status_code=201)
async def create_milestone(
    logframe_id: int, result_id: int, activity_id: int,
    body: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    obj = Milestone(**body.model_dump(exclude={"activity_id"}), activity_id=activity_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/milestones/{milestone_id}", status_code=204)
async def delete_milestone(
    logframe_id: int, result_id: int, activity_id: int, milestone_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(Milestone).where(Milestone.id == milestone_id, Milestone.activity_id == activity_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Milestone not found")
    await db.delete(obj)
    await db.commit()
