from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Logframe(Base):
    __tablename__ = "logframe_logframe"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    project_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("org_project.id"), nullable=True
    )
    program_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("org_program.id"), nullable=True
    )

    project: Mapped["Project | None"] = relationship("Project", back_populates="logframes")
    program: Mapped["Program | None"] = relationship("Program", back_populates="logframes")
    results: Mapped[list[Result]] = relationship("Result", back_populates="logframe", order_by="Result.order")


class Result(Base):
    __tablename__ = "logframe_result"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("logframe_result.id"), nullable=True)
    rating_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("logframe_rating.id"), nullable=True)
    contribution_weighting: Mapped[int] = mapped_column(Integer, default=100)

    logframe: Mapped[Logframe] = relationship("Logframe", back_populates="results")
    indicators: Mapped[list[Indicator]] = relationship(
        "Indicator", back_populates="result", order_by="Indicator.order", cascade="all, delete-orphan",
    )
    activities: Mapped[list[Activity]] = relationship(
        "Activity", back_populates="result", order_by="Activity.order", cascade="all, delete-orphan",
    )
    assumptions: Mapped[list[Assumption]] = relationship(
        "Assumption", back_populates="result", cascade="all, delete-orphan",
    )
    children: Mapped[list[Result]] = relationship("Result", back_populates="parent")
    parent: Mapped[Result | None] = relationship("Result", back_populates="children", remote_side="Result.id")
    rating: Mapped[Rating | None] = relationship("Rating", back_populates="results")


class DisaggregationCategory(Base):
    """Logframe-scoped disaggregation category (e.g. Gender, Age Group, District)."""

    __tablename__ = "logframe_disaggregation_category"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))
    name: Mapped[str] = mapped_column(String(255))
    order: Mapped[int] = mapped_column(Integer, default=0)


class Indicator(Base):
    __tablename__ = "logframe_indicator"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)
    result_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_result.id"))
    source_of_verification: Mapped[str] = mapped_column(String(255), default="")
    needs_baseline: Mapped[bool] = mapped_column(Boolean, default=True)
    # Phase 2: Formula support
    formula_config: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)
    is_computed: Mapped[bool] = mapped_column(Boolean, default=False)
    # Phase 4: Dynamic builder
    measurement_type: Mapped[str] = mapped_column(String(50), default="numeric")
    unit: Mapped[str] = mapped_column(String(50), default="")
    # Library provenance
    library_indicator_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("library_indicator.id"), nullable=True
    )

    result: Mapped[Result] = relationship("Result", back_populates="indicators")
    subindicators: Mapped[list[SubIndicator]] = relationship(
        "SubIndicator", back_populates="indicator", order_by="SubIndicator.order",
        cascade="all, delete-orphan",
    )
    tags: Mapped[list[IndicatorTag]] = relationship(
        "IndicatorTag", back_populates="indicator", cascade="all, delete-orphan",
    )


class SubIndicator(Base):
    __tablename__ = "logframe_subindicator"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    order: Mapped[int] = mapped_column(Integer, default=0)
    indicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_indicator.id"))
    # Phase 1: Disaggregation
    disaggregation_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("logframe_disaggregation_category.id"), nullable=True
    )
    disaggregation_value: Mapped[str] = mapped_column(String(255), default="")

    indicator: Mapped[Indicator] = relationship("Indicator", back_populates="subindicators")
    disaggregation_category: Mapped[DisaggregationCategory | None] = relationship("DisaggregationCategory")
    data_entries: Mapped[list[DataEntry]] = relationship(
        "DataEntry", back_populates="subindicator", cascade="all, delete-orphan",
    )
    targets: Mapped[list[Target]] = relationship(
        "Target", back_populates="subindicator", cascade="all, delete-orphan",
    )


class Activity(Base):
    __tablename__ = "logframe_activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)
    result_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_result.id"))
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    lead_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("contacts_user.id"), nullable=True)
    deliverables: Mapped[str] = mapped_column(Text, default="")

    result: Mapped[Result] = relationship("Result", back_populates="activities")
    lead: Mapped["User | None"] = relationship("User")
    milestones: Mapped[list[Milestone]] = relationship(
        "Milestone", back_populates="activity", cascade="all, delete-orphan",
    )
    budget_lines: Mapped[list[BudgetLine]] = relationship(
        "BudgetLine", back_populates="activity", cascade="all, delete-orphan",
    )
    ta_lines: Mapped[list[TALine]] = relationship(
        "TALine", back_populates="activity", cascade="all, delete-orphan",
    )
    status_updates: Mapped[list[StatusUpdate]] = relationship(
        "StatusUpdate", back_populates="activity", cascade="all, delete-orphan",
    )
    resources: Mapped[list[Resource]] = relationship(
        "Resource", back_populates="activity", cascade="all, delete-orphan",
    )


class Column(Base):
    __tablename__ = "logframe_column"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))

    data_entries: Mapped[list[DataEntry]] = relationship(
        "DataEntry", back_populates="column", cascade="all, delete-orphan",
    )


class DataEntry(Base):
    __tablename__ = "logframe_dataentry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data: Mapped[str | None] = mapped_column(String(255), nullable=True)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    subindicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_subindicator.id"))
    column_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_column.id"))
    # Phase 2: Distinguishes formula-generated from hand-entered values
    is_computed: Mapped[bool] = mapped_column(Boolean, default=False)

    subindicator: Mapped[SubIndicator] = relationship("SubIndicator", back_populates="data_entries")
    column: Mapped[Column] = relationship("Column", back_populates="data_entries")


class Rating(Base):
    __tablename__ = "logframe_rating"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    color: Mapped[str] = mapped_column(String(7), default="#9ca3af")
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))

    results: Mapped[list[Result]] = relationship("Result", back_populates="rating")


class RiskRating(Base):
    __tablename__ = "logframe_riskrating"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))

    assumptions: Mapped[list[Assumption]] = relationship("Assumption", back_populates="risk_rating")


class Assumption(Base):
    __tablename__ = "logframe_assumption"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    description: Mapped[str] = mapped_column(Text, default="")
    result_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_result.id"))
    risk_rating_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("logframe_riskrating.id"), nullable=True
    )

    result: Mapped[Result] = relationship("Result", back_populates="assumptions")
    risk_rating: Mapped[RiskRating | None] = relationship("RiskRating", back_populates="assumptions")


class BudgetLine(Base):
    __tablename__ = "logframe_budgetline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    category: Mapped[str] = mapped_column(String(100), default="")
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_activity.id"))

    activity: Mapped[Activity] = relationship("Activity", back_populates="budget_lines")


class Milestone(Base):
    __tablename__ = "logframe_milestone"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_activity.id"))
    period_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("logframe_period.id"), nullable=True
    )
    description: Mapped[str] = mapped_column(String(500), default="")

    activity: Mapped[Activity] = relationship("Activity", back_populates="milestones")
    period: Mapped[Period | None] = relationship("Period", back_populates="milestones")


class StatusCode(Base):
    __tablename__ = "logframe_statuscode"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))


class Tag(Base):
    __tablename__ = "logframe_tag"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))

    indicators: Mapped[list[IndicatorTag]] = relationship(
        "IndicatorTag", back_populates="tag", cascade="all, delete-orphan",
    )


class IndicatorTag(Base):
    __tablename__ = "logframe_indicatortag"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    indicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_indicator.id"))
    tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_tag.id"))

    indicator: Mapped[Indicator] = relationship("Indicator", back_populates="tags")
    tag: Mapped[Tag] = relationship("Tag", back_populates="indicators")


class Period(Base):
    __tablename__ = "logframe_period"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    start_month: Mapped[int] = mapped_column(Integer)
    start_year: Mapped[int] = mapped_column(Integer)
    end_month: Mapped[int] = mapped_column(Integer)
    end_year: Mapped[int] = mapped_column(Integer)
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))

    milestones: Mapped[list[Milestone]] = relationship(
        "Milestone", back_populates="period", cascade="all, delete-orphan",
    )
    reporting_periods: Mapped[list[ReportingPeriod]] = relationship(
        "ReportingPeriod", back_populates="period", cascade="all, delete-orphan",
    )
    targets: Mapped[list[Target]] = relationship(
        "Target", back_populates="milestone", cascade="all, delete-orphan",
    )


class ReportingPeriod(Base):
    __tablename__ = "logframe_reportingperiod"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_period.id"))
    subindicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_subindicator.id"))
    value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="OK")  # OK, WARNING, DANGER

    period: Mapped[Period] = relationship("Period", back_populates="reporting_periods")
    subindicator: Mapped[SubIndicator] = relationship("SubIndicator")


class Target(Base):
    __tablename__ = "logframe_target"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    indicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_indicator.id"))
    subindicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_subindicator.id"))
    milestone_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_period.id"))
    value: Mapped[str | None] = mapped_column(String(255), nullable=True)

    indicator: Mapped[Indicator] = relationship("Indicator")
    subindicator: Mapped[SubIndicator] = relationship("SubIndicator", back_populates="targets")
    milestone: Mapped[Period] = relationship("Period", back_populates="targets")


class TALine(Base):
    __tablename__ = "logframe_taline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_activity.id"))
    type: Mapped[str] = mapped_column(String(255), default="")
    name: Mapped[str] = mapped_column(String(255), default="")
    band: Mapped[str] = mapped_column(String(10), default="")  # Low, Medium, High
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    no_days: Mapped[int] = mapped_column(Integer, default=0)
    amount: Mapped[float] = mapped_column(Float, default=0.0)

    activity: Mapped[Activity] = relationship("Activity", back_populates="ta_lines")


class StatusUpdate(Base):
    __tablename__ = "logframe_statusupdate"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_activity.id"))
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts_user.id"))
    code_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("logframe_statuscode.id"), nullable=True)
    date: Mapped[date] = mapped_column(Date)
    description: Mapped[str] = mapped_column(Text, default="")

    activity: Mapped[Activity] = relationship("Activity", back_populates="status_updates")
    user: Mapped["User"] = relationship("User")
    code: Mapped[StatusCode | None] = relationship("StatusCode")


class Expense(Base):
    """Actual spending record against a budget line."""

    __tablename__ = "logframe_expense"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    budget_line_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logframe_budgetline.id", ondelete="CASCADE")
    )
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(String(500), default="")
    date: Mapped[date] = mapped_column(Date)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("contacts_user.id"), nullable=True
    )

    budget_line: Mapped[BudgetLine] = relationship("BudgetLine")
    user: Mapped["User | None"] = relationship("User")


class Resource(Base):
    """Human, equipment, or partner resource assigned to an activity."""

    __tablename__ = "logframe_resource"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    activity_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logframe_activity.id", ondelete="CASCADE")
    )
    resource_type: Mapped[str] = mapped_column(String(20))  # human, equipment, partner
    # Human resource fields
    role: Mapped[str] = mapped_column(String(255), default="")
    person: Mapped[str] = mapped_column(String(255), default="")
    # Equipment fields
    resource_name: Mapped[str] = mapped_column(String(255), default="")
    # Partner fields
    organisation_name: Mapped[str] = mapped_column(String(255), default="")
    role_in_activity: Mapped[str] = mapped_column(String(255), default="")
    # Shared fields
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    days_required: Mapped[int] = mapped_column(Integer, default=0)
    allocation_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)

    activity: Mapped[Activity] = relationship("Activity", back_populates="resources")
