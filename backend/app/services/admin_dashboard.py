"""Platform-wide dashboard aggregation for admin portal."""

from __future__ import annotations

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contacts import User
from app.models.org import Organisation, OrganisationMembership, Program, Project
from app.models.logframe import (
    Activity,
    BudgetLine,
    Expense,
    Logframe,
    Result,
)
from app.models.audit import AuditLog


async def get_platform_dashboard(db: AsyncSession) -> dict:
    """Build aggregated dashboard data across the entire platform."""

    # --- Counts ---
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_user_count = (
        await db.execute(
            select(func.count(User.id)).where(User.is_active.is_(True))
        )
    ).scalar() or 0

    org_count = (await db.execute(select(func.count(Organisation.id)))).scalar() or 0
    program_count = (await db.execute(select(func.count(Program.id)))).scalar() or 0
    project_count = (await db.execute(select(func.count(Project.id)))).scalar() or 0
    logframe_count = (await db.execute(select(func.count(Logframe.id)))).scalar() or 0

    # --- Budget totals ---
    budget_q = await db.execute(
        select(func.coalesce(func.sum(BudgetLine.amount), 0.0))
    )
    total_budget = float(budget_q.scalar() or 0.0)

    spent_q = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0.0))
    )
    total_spent = float(spent_q.scalar() or 0.0)

    # --- Recent signups (last 10) ---
    recent_signups_q = await db.execute(
        select(User)
        .order_by(desc(User.date_joined))
        .limit(10)
    )
    recent_signups = []
    for user in recent_signups_q.scalars().all():
        # Count orgs per user
        oc = (
            await db.execute(
                select(func.count(OrganisationMembership.id)).where(
                    OrganisationMembership.user_id == user.id
                )
            )
        ).scalar() or 0
        recent_signups.append({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "email": user.email or "",
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active,
            "date_joined": user.date_joined,
            "last_login": user.last_login,
            "org_count": oc,
        })

    # --- Recent audit entries (last 10) ---
    recent_audit_q = await db.execute(
        select(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.timestamp))
        .limit(10)
    )
    recent_audit_entries = [
        {
            "id": entry.id,
            "user_id": entry.user_id,
            "username": username,
            "action": entry.action,
            "entity_type": entry.entity_type,
            "entity_id": entry.entity_id,
            "changes": entry.changes or "{}",
            "logframe_id": entry.logframe_id,
            "timestamp": entry.timestamp,
        }
        for entry, username in recent_audit_q.all()
    ]

    # --- Top 10 orgs by member count ---
    org_breakdown_q = await db.execute(
        select(
            Organisation.id,
            Organisation.name,
            func.count(OrganisationMembership.id).label("member_count"),
        )
        .outerjoin(
            OrganisationMembership,
            Organisation.id == OrganisationMembership.organisation_id,
        )
        .group_by(Organisation.id, Organisation.name)
        .order_by(desc("member_count"))
        .limit(10)
    )
    org_breakdown = []
    for org_id, org_name, member_count in org_breakdown_q.all():
        lf_count = (
            await db.execute(
                select(func.count(Logframe.id)).where(
                    Logframe.project_id.in_(
                        select(Project.id).where(
                            Project.program_id.in_(
                                select(Program.id).where(
                                    Program.organisation_id == org_id
                                )
                            )
                        )
                    )
                )
            )
        ).scalar() or 0
        org_breakdown.append({
            "name": org_name,
            "member_count": member_count,
            "logframe_count": lf_count,
        })

    return {
        "user_count": user_count,
        "active_user_count": active_user_count,
        "org_count": org_count,
        "logframe_count": logframe_count,
        "project_count": project_count,
        "program_count": program_count,
        "total_budget": round(total_budget, 2),
        "total_spent": round(total_spent, 2),
        "recent_signups": recent_signups,
        "recent_audit_entries": recent_audit_entries,
        "org_breakdown": org_breakdown,
    }
