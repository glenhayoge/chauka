from datetime import date as date_type, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.security.sanitize import sanitize_html


# --- Organisation ---

class OrganisationBase(BaseModel):
    name: str
    slug: str
    description: str = ""
    logo_url: str = ""
    country: str = ""
    org_type: str = ""
    sector: str = ""


class OrganisationCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    logo_url: str = ""
    country: str = ""
    org_type: str = ""
    sector: str = ""

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class OrganisationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    logo_url: str | None = None
    country: str | None = None
    org_type: str | None = None
    sector: str | None = None

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class OrganisationRead(OrganisationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: UUID
    owner_id: int
    created_at: datetime
    updated_at: datetime


# --- Program ---

class ProgramBase(BaseModel):
    name: str
    description: str = ""
    organisation_id: int
    start_date: date_type | None = None
    end_date: date_type | None = None


class ProgramCreate(BaseModel):
    name: str
    description: str = ""
    start_date: date_type | None = None
    end_date: date_type | None = None

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class ProgramUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class ProgramRead(ProgramBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: UUID


# --- Project ---

class ProjectBase(BaseModel):
    name: str
    description: str = ""
    program_id: int | None = None
    organisation_id: int | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None
    status: str = "active"


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    start_date: date_type | None = None
    end_date: date_type | None = None
    status: str = "active"

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None
    status: str | None = None

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: UUID


# --- Organisation Membership ---

class MembershipCreate(BaseModel):
    user_id: int
    role: str = "member"  # "admin" | "member"


class MembershipRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    organisation_id: int
    role: str
    created_at: datetime


# --- Project Role ---

class ProjectRoleCreate(BaseModel):
    user_id: int
    role: str = "viewer"  # "lead" | "collector" | "viewer"


class ProjectRoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    project_id: int
    role: str
    created_at: datetime


# --- Organisation Dashboard ---

class IndicatorHealthBreakdown(BaseModel):
    on_track: int = 0
    caution: int = 0
    off_track: int = 0
    not_rated: int = 0


class RecentStatusUpdateRead(BaseModel):
    id: int
    activity_name: str
    logframe_name: str
    date: date_type
    description: str
    user_id: int


class OrgDashboardRead(BaseModel):
    """Aggregated organisation dashboard data across all logframes."""
    # Counts
    program_count: int = 0
    project_count: int = 0
    logframe_count: int = 0
    result_count: int = 0
    indicator_count: int = 0
    activity_count: int = 0

    # Budget
    total_budget: float = 0.0
    total_spent: float = 0.0
    utilisation_pct: float = 0.0

    # Indicator health
    indicator_health: IndicatorHealthBreakdown = IndicatorHealthBreakdown()

    # Recent status updates
    recent_status_updates: list[RecentStatusUpdateRead] = []
