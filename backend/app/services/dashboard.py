"""Organisation dashboard aggregation service.

Traverses org -> programs -> projects -> logframes to aggregate:
- Counts (programs, projects, logframes, results, indicators, activities)
- Budget totals (allocated, spent, utilisation %)
- Indicator health (On Track / Caution / Off Track / Not Rated)
- Recent status updates (last 10 across all logframes)
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logframe import (
    Activity,
    BudgetLine,
    Expense,
    Indicator,
    Logframe,
    Rating,
    Result,
    StatusUpdate,
)
from app.models.org import Organisation, Program, Project


async def get_org_logframe_ids(
    organisation_id: int, db: AsyncSession
) -> list[int]:
    """Collect all logframe IDs belonging to an organisation.

    Traversal paths:
    1. org -> programs -> logframes (program-level logframes)
    2. org -> programs -> projects -> logframes
    3. org -> standalone projects -> logframes
    """
    logframe_ids: set[int] = set()

    # Get program IDs for this org
    prog_result = await db.execute(
        select(Program.id).where(Program.organisation_id == organisation_id)
    )
    program_ids = [row[0] for row in prog_result.all()]

    if program_ids:
        # Program-level logframes
        lf_result = await db.execute(
            select(Logframe.id).where(Logframe.program_id.in_(program_ids))
        )
        logframe_ids.update(row[0] for row in lf_result.all())

        # Projects under programs
        proj_result = await db.execute(
            select(Project.id).where(Project.program_id.in_(program_ids))
        )
        program_project_ids = [row[0] for row in proj_result.all()]

        if program_project_ids:
            lf_result = await db.execute(
                select(Logframe.id).where(Logframe.project_id.in_(program_project_ids))
            )
            logframe_ids.update(row[0] for row in lf_result.all())

    # Standalone projects (directly under org, no program)
    standalone_result = await db.execute(
        select(Project.id).where(
            Project.organisation_id == organisation_id,
            Project.program_id.is_(None),
        )
    )
    standalone_project_ids = [row[0] for row in standalone_result.all()]

    if standalone_project_ids:
        lf_result = await db.execute(
            select(Logframe.id).where(Logframe.project_id.in_(standalone_project_ids))
        )
        logframe_ids.update(row[0] for row in lf_result.all())

    return list(logframe_ids)


async def get_org_dashboard(organisation_id: int, db: AsyncSession) -> dict:
    """Build aggregated dashboard data for an organisation."""

    # --- Counts ---
    program_count_result = await db.execute(
        select(func.count(Program.id)).where(
            Program.organisation_id == organisation_id
        )
    )
    program_count = program_count_result.scalar() or 0

    # All projects: under programs + standalone
    prog_ids_result = await db.execute(
        select(Program.id).where(Program.organisation_id == organisation_id)
    )
    program_ids = [row[0] for row in prog_ids_result.all()]

    project_count = 0
    if program_ids:
        pc_result = await db.execute(
            select(func.count(Project.id)).where(
                Project.program_id.in_(program_ids)
            )
        )
        project_count += pc_result.scalar() or 0

    # Standalone projects
    spc_result = await db.execute(
        select(func.count(Project.id)).where(
            Project.organisation_id == organisation_id,
            Project.program_id.is_(None),
        )
    )
    project_count += spc_result.scalar() or 0

    # Logframes
    logframe_ids = await get_org_logframe_ids(organisation_id, db)
    logframe_count = len(logframe_ids)

    if not logframe_ids:
        return {
            "program_count": program_count,
            "project_count": project_count,
            "logframe_count": 0,
            "result_count": 0,
            "indicator_count": 0,
            "activity_count": 0,
            "total_budget": 0.0,
            "total_spent": 0.0,
            "utilisation_pct": 0.0,
            "indicator_health": {
                "on_track": 0,
                "caution": 0,
                "off_track": 0,
                "not_rated": 0,
            },
            "recent_status_updates": [],
        }

    # Results count
    result_count_q = await db.execute(
        select(func.count(Result.id)).where(
            Result.logframe_id.in_(logframe_ids)
        )
    )
    result_count = result_count_q.scalar() or 0

    # Indicator count
    indicator_count_q = await db.execute(
        select(func.count(Indicator.id)).where(
            Indicator.result_id.in_(
                select(Result.id).where(Result.logframe_id.in_(logframe_ids))
            )
        )
    )
    indicator_count = indicator_count_q.scalar() or 0

    # Activity count
    activity_count_q = await db.execute(
        select(func.count(Activity.id)).where(
            Activity.result_id.in_(
                select(Result.id).where(Result.logframe_id.in_(logframe_ids))
            )
        )
    )
    activity_count = activity_count_q.scalar() or 0

    # --- Budget ---
    activity_ids_q = select(Activity.id).where(
        Activity.result_id.in_(
            select(Result.id).where(Result.logframe_id.in_(logframe_ids))
        )
    )

    budget_q = await db.execute(
        select(func.coalesce(func.sum(BudgetLine.amount), 0.0)).where(
            BudgetLine.activity_id.in_(activity_ids_q)
        )
    )
    total_budget = float(budget_q.scalar() or 0.0)

    budget_line_ids_q = select(BudgetLine.id).where(
        BudgetLine.activity_id.in_(activity_ids_q)
    )
    spent_q = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0.0)).where(
            Expense.budget_line_id.in_(budget_line_ids_q)
        )
    )
    total_spent = float(spent_q.scalar() or 0.0)

    utilisation_pct = (total_spent / total_budget * 100.0) if total_budget > 0 else 0.0

    # --- Indicator health (based on result ratings) ---
    # Ratings are per-logframe with names like "On Track", "Caution", "Off Track"
    # Results reference a rating_id. We count results by their rating name.
    on_track = 0
    caution = 0
    off_track = 0
    not_rated = 0

    # Get all results with their ratings for these logframes
    results_with_ratings = await db.execute(
        select(Result.id, Result.rating_id, Rating.name)
        .outerjoin(Rating, Result.rating_id == Rating.id)
        .where(Result.logframe_id.in_(logframe_ids))
    )
    for _result_id, rating_id, rating_name in results_with_ratings.all():
        if rating_id is None or rating_name is None:
            not_rated += 1
        elif "on track" in rating_name.lower():
            on_track += 1
        elif "caution" in rating_name.lower():
            caution += 1
        elif "off track" in rating_name.lower():
            off_track += 1
        else:
            not_rated += 1

    # --- Recent status updates (last 10) ---
    recent_updates_q = await db.execute(
        select(
            StatusUpdate.id,
            StatusUpdate.date,
            StatusUpdate.description,
            StatusUpdate.user_id,
            Activity.name.label("activity_name"),
            Logframe.name.label("logframe_name"),
        )
        .join(Activity, StatusUpdate.activity_id == Activity.id)
        .join(Result, Activity.result_id == Result.id)
        .join(Logframe, Result.logframe_id == Logframe.id)
        .where(Logframe.id.in_(logframe_ids))
        .order_by(StatusUpdate.date.desc(), StatusUpdate.id.desc())
        .limit(10)
    )
    recent_status_updates = [
        {
            "id": row.id,
            "activity_name": row.activity_name,
            "logframe_name": row.logframe_name,
            "date": row.date,
            "description": row.description,
            "user_id": row.user_id,
        }
        for row in recent_updates_q.all()
    ]

    return {
        "program_count": program_count,
        "project_count": project_count,
        "logframe_count": logframe_count,
        "result_count": result_count,
        "indicator_count": indicator_count,
        "activity_count": activity_count,
        "total_budget": round(total_budget, 2),
        "total_spent": round(total_spent, 2),
        "utilisation_pct": round(utilisation_pct, 1),
        "indicator_health": {
            "on_track": on_track,
            "caution": caution,
            "off_track": off_track,
            "not_rated": not_rated,
        },
        "recent_status_updates": recent_status_updates,
    }
