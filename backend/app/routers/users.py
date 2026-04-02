from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.contacts import User
from app.schemas.users import UserRead

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)


@router.get("/", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(User).where(User.is_active == True).order_by(User.username)  # noqa: E712
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/search", response_model=list[UserRead])
async def search_users(
    q: str = Query(..., min_length=2, description="Search by username, email, or name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search for users by username, email, first name, or last name."""
    pattern = f"%{q}%"
    stmt = (
        select(User)
        .where(
            User.is_active == True,  # noqa: E712
            or_(
                User.username.ilike(pattern),
                User.email.ilike(pattern),
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
            ),
        )
        .order_by(User.username)
        .limit(10)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
