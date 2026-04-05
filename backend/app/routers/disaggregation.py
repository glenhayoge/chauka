"""CRUD for disaggregation categories."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_logframe_editor
from app.database import get_db
from app.models.contacts import User
from app.models.logframe import DisaggregationCategory, SubIndicator
from app.schemas.logframe import (
    DisaggregationCategoryCreate,
    DisaggregationCategoryRead,
    DisaggregationCategoryUpdate,
)

router = APIRouter(
    prefix="/api/logframes/{logframe_id}/disaggregation-categories",
    tags=["disaggregation"],
)


@router.get("/", response_model=list[DisaggregationCategoryRead])
async def list_categories(
    logframe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DisaggregationCategory)
        .where(DisaggregationCategory.logframe_id == logframe_id)
        .order_by(DisaggregationCategory.order)
    )
    return result.scalars().all()


@router.post("/", response_model=DisaggregationCategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    logframe_id: int,
    body: DisaggregationCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    cat = DisaggregationCategory(
        logframe_id=logframe_id,
        name=body.name,
        order=body.order,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.patch("/{category_id}", response_model=DisaggregationCategoryRead)
async def update_category(
    logframe_id: int,
    category_id: int,
    body: DisaggregationCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(DisaggregationCategory).where(
            DisaggregationCategory.id == category_id,
            DisaggregationCategory.logframe_id == logframe_id,
        )
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    logframe_id: int,
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_logframe_editor),
):
    result = await db.execute(
        select(DisaggregationCategory).where(
            DisaggregationCategory.id == category_id,
            DisaggregationCategory.logframe_id == logframe_id,
        )
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Nullify referencing SubIndicators
    await db.execute(
        update(SubIndicator)
        .where(SubIndicator.disaggregation_category_id == category_id)
        .values(disaggregation_category_id=None, disaggregation_value="")
    )

    await db.delete(cat)
    await db.commit()
