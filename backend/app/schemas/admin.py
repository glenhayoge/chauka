"""Schemas for the platform admin portal."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


# --- Admin User Management ---


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    is_staff: bool
    is_superuser: bool
    is_active: bool
    date_joined: str | None = None
    last_login: str | None = None
    org_count: int = 0


class AdminUserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    is_staff: bool | None = None
    is_superuser: bool | None = None
    is_active: bool | None = None


class AdminUserCreate(BaseModel):
    username: str
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""
    is_staff: bool = False
    is_superuser: bool = False


class PaginatedUsers(BaseModel):
    items: list[AdminUserRead]
    total: int
    page: int
    page_size: int


# --- Platform Dashboard ---


class OrgBreakdown(BaseModel):
    name: str
    member_count: int
    logframe_count: int


class AuditEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str | None = None
    action: str
    entity_type: str
    entity_id: int
    changes: str
    logframe_id: int | None = None
    timestamp: datetime | None = None


class PlatformDashboardRead(BaseModel):
    user_count: int = 0
    active_user_count: int = 0
    org_count: int = 0
    logframe_count: int = 0
    project_count: int = 0
    program_count: int = 0
    total_budget: float = 0.0
    total_spent: float = 0.0
    recent_signups: list[AdminUserRead] = []
    recent_audit_entries: list[AuditEntryRead] = []
    org_breakdown: list[OrgBreakdown] = []


# --- RBAC Management ---


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codename: str
    name: str
    description: str
    category: str


class PermissionCreate(BaseModel):
    codename: str
    name: str
    description: str = ""
    category: str = "general"


class RolePermissionSummary(BaseModel):
    role: str
    permissions: list[str]


# --- Admin Organisation ---


class AdminOrgRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    description: str
    country: str
    org_type: str
    sector: str
    owner_id: int
    owner_username: str | None = None
    created_at: str | None = None
    member_count: int = 0
    logframe_count: int = 0


class PaginatedOrgs(BaseModel):
    items: list[AdminOrgRead]
    total: int
    page: int
    page_size: int
