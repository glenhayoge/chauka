from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appconf import Settings
from app.models.contacts import User
from app.models.logframe import (
    Activity, Assumption, BudgetLine, Column, DataEntry, Expense,
    Indicator, IndicatorTag, Logframe, Milestone, Period,
    Rating, ReportingPeriod, Resource, Result, RiskRating, StatusCode, StatusUpdate, SubIndicator, TALine, Tag, Target,
)
from app.models.org import Organisation, Program, Project
from app.services.rbac import can_edit_logframe, get_effective_role


_DEFAULT_LEVEL_LABELS = {1: "Impact (Goal)", 2: "Outcome", 3: "Output"}
_COMPONENT_LEVEL_LABELS = {1: "Impact (Goal)", 2: "Outcome", 3: "Component", 4: "Output"}


def _build_levels(max_level: int, use_components: bool = False) -> dict[str, str]:
    """Build a level-number -> label mapping.

    When use_components is True, inserts a "Component" level between
    Outcome and Output: Impact(1) → Outcome(2) → Component(3) → Output(4).

    Keys are strings to match the JSON convention used by the legacy Django app.
    """
    labels = _COMPONENT_LEVEL_LABELS if use_components else _DEFAULT_LEVEL_LABELS
    levels: dict[str, str] = {}
    for n in range(1, max_level + 1):
        levels[str(n)] = labels.get(n, f"Level {n}")
    return levels


def _row(obj) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


async def get_bootstrap_data(logframe_id: int, db: AsyncSession, current_user: User) -> dict | None:
    lf_result = await db.execute(select(Logframe).where(Logframe.id == logframe_id))
    logframe = lf_result.scalar_one_or_none()
    if logframe is None:
        return None

    async def fetch(model, **filters):
        stmt = select(model)
        for col, val in filters.items():
            stmt = stmt.where(getattr(model, col) == val)
        r = await db.execute(stmt)
        return r.scalars().all()

    results = await fetch(Result, logframe_id=logframe_id)
    result_ids = {r.id for r in results}

    all_indicators = await fetch(Indicator)
    indicators = [i for i in all_indicators if i.result_id in result_ids]
    indicator_ids = {i.id for i in indicators}

    all_subindicators = await fetch(SubIndicator)
    subindicators = [s for s in all_subindicators if s.indicator_id in indicator_ids]
    subindicator_ids = {s.id for s in subindicators}

    all_activities = await fetch(Activity)
    activities = [a for a in all_activities if a.result_id in result_ids]
    activity_ids = {a.id for a in activities}

    columns = await fetch(Column, logframe_id=logframe_id)
    column_ids = {c.id for c in columns}

    all_data_entries = await fetch(DataEntry)
    data_entries = [
        d for d in all_data_entries
        if d.subindicator_id in subindicator_ids and d.column_id in column_ids
    ]

    ratings = await fetch(Rating, logframe_id=logframe_id)
    risk_ratings = await fetch(RiskRating, logframe_id=logframe_id)

    all_assumptions = await fetch(Assumption)
    assumptions = [a for a in all_assumptions if a.result_id in result_ids]

    all_budget_lines = await fetch(BudgetLine)
    budget_lines = [b for b in all_budget_lines if b.activity_id in activity_ids]

    all_ta_lines = await fetch(TALine)
    ta_lines = [t for t in all_ta_lines if t.activity_id in activity_ids]

    budget_line_ids = {b.id for b in budget_lines}
    all_expenses = await fetch(Expense)
    expenses = [e for e in all_expenses if e.budget_line_id in budget_line_ids]

    all_resources = await fetch(Resource)
    resources = [r for r in all_resources if r.activity_id in activity_ids]

    periods = await fetch(Period, logframe_id=logframe_id)
    period_ids = {p.id for p in periods}

    all_milestones = await fetch(Milestone)
    milestones = [m for m in all_milestones if m.activity_id in activity_ids]

    all_targets = await fetch(Target)
    targets = [
        t for t in all_targets
        if t.subindicator_id in subindicator_ids and t.milestone_id in period_ids
    ]

    all_status_updates = await fetch(StatusUpdate)
    status_updates = [su for su in all_status_updates if su.activity_id in activity_ids]

    status_codes = await fetch(StatusCode, logframe_id=logframe_id)
    tags = await fetch(Tag, logframe_id=logframe_id)

    all_indicator_tags = await fetch(IndicatorTag)
    indicator_tags = [it for it in all_indicator_tags if it.indicator_id in indicator_ids]

    all_reporting_periods = await fetch(ReportingPeriod)
    reporting_periods = [
        rp for rp in all_reporting_periods
        if rp.subindicator_id in subindicator_ids and rp.period_id in period_ids
    ]

    settings_result = await db.execute(
        select(Settings).where(Settings.logframe_id == logframe_id)
    )
    settings = settings_result.scalar_one_or_none()

    # Compute levels dict and conf from settings
    max_level = settings.max_result_level if settings else 3
    open_level = settings.open_result_level if settings else 0
    use_components = getattr(settings, 'use_components', False) if settings else False

    # When components enabled, ensure max_level is at least 4
    if use_components and max_level < 4:
        max_level = 4

    levels = _build_levels(max_level, use_components=use_components)
    conf = {
        "max_result_level": max_level,
        "open_result_level": open_level,
        "use_components": use_components,
    }

    can_edit = await can_edit_logframe(current_user, logframe_id, db)
    user_role = await get_effective_role(current_user, logframe_id, db)

    # Resolve org context via flexible hierarchy:
    # logframe → project → program → org  (full chain)
    # logframe → program → org            (no project)
    # logframe → project → org            (no program)
    org_context = None
    project = None
    program = None
    organisation = None

    if logframe.project_id:
        proj_result = await db.execute(select(Project).where(Project.id == logframe.project_id))
        project = proj_result.scalar_one_or_none()
        if project and project.program_id:
            prog_result = await db.execute(select(Program).where(Program.id == project.program_id))
            program = prog_result.scalar_one_or_none()
            if program:
                org_result = await db.execute(select(Organisation).where(Organisation.id == program.organisation_id))
                organisation = org_result.scalar_one_or_none()
        elif project and project.organisation_id:
            org_result = await db.execute(select(Organisation).where(Organisation.id == project.organisation_id))
            organisation = org_result.scalar_one_or_none()

    if not organisation and logframe.program_id:
        prog_result = await db.execute(select(Program).where(Program.id == logframe.program_id))
        program = prog_result.scalar_one_or_none()
        if program:
            org_result = await db.execute(select(Organisation).where(Organisation.id == program.organisation_id))
            organisation = org_result.scalar_one_or_none()

    if organisation:
        org_context = {
            "organisation": _row(organisation),
            "program": _row(program) if program else None,
            "project": _row(project) if project else None,
        }

    return {
        "logframe": _row(logframe),
        "results": [_row(r) for r in results],
        "indicators": [_row(i) for i in indicators],
        "subIndicators": [_row(s) for s in subindicators],
        "activities": [_row(a) for a in activities],
        "columns": [_row(c) for c in columns],
        "dataEntries": [_row(d) for d in data_entries],
        "ratings": [_row(r) for r in ratings],
        "riskRatings": [_row(r) for r in risk_ratings],
        "assumptions": [_row(a) for a in assumptions],
        "budgetLines": [_row(b) for b in budget_lines],
        "taLines": [_row(t) for t in ta_lines],
        "expenses": [_row(e) for e in expenses],
        "resources": [_row(r) for r in resources],
        "milestones": [_row(m) for m in milestones],
        "targets": [_row(t) for t in targets],
        "statusUpdates": [_row(su) for su in status_updates],
        "statusCodes": [_row(s) for s in status_codes],
        "tags": [_row(t) for t in tags],
        "indicatorTags": [_row(it) for it in indicator_tags],
        "periods": [_row(p) for p in periods],
        "reportingPeriods": [_row(rp) for rp in reporting_periods],
        "settings": _row(settings) if settings else None,
        "levels": levels,
        "conf": conf,
        "canEdit": can_edit,
        "userRole": user_role,
        "orgContext": org_context,
    }
