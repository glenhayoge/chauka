from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import Expense, BudgetLine
from app.schemas.logframe import ExpenseCreate, ExpenseRead, ExpenseUpdate

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/expenses",
    tags=["expenses"],
)


@router.get("/", response_model=list[ExpenseRead])
async def list_expenses(
    logframe_id: int,
    budget_line: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Expense)
    if budget_line:
        stmt = stmt.where(Expense.budget_line_id == budget_line)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ExpenseRead, status_code=201)
async def create_expense(
    logframe_id: int,
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    # Verify budget line exists
    bl = await db.execute(select(BudgetLine).where(BudgetLine.id == body.budget_line_id))
    if not bl.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="BudgetLine not found")
    obj = Expense(**body.model_dump(), user_id=current_user.id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{expense_id}", response_model=ExpenseRead)
async def update_expense(
    logframe_id: int,
    expense_id: int,
    body: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    logframe_id: int,
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(obj)
    await db.commit()
