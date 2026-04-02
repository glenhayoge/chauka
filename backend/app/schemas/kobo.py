"""Pydantic schemas for KoboToolBox integration endpoints."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


# --- Connection schemas ---

class KoboConnectionCreate(BaseModel):
    server_url: str = "https://kf.kobotoolbox.org"
    api_token: str


class KoboConnectionUpdate(BaseModel):
    server_url: str | None = None
    api_token: str | None = None
    is_active: bool | None = None


class KoboConnectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    logframe_id: int
    server_url: str
    is_active: bool
    created_at: datetime | None = None


# --- Field mapping schemas ---

class KoboFieldMappingCreate(BaseModel):
    kobo_form_id: str
    kobo_field_name: str
    subindicator_id: int
    column_id: int | None = None
    auto_create_column: bool = False
    aggregation: str = "latest"


class KoboFieldMappingUpdate(BaseModel):
    kobo_field_name: str | None = None
    subindicator_id: int | None = None
    column_id: int | None = None
    auto_create_column: bool | None = None
    aggregation: str | None = None
    is_active: bool | None = None


class KoboFieldMappingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    connection_id: int
    kobo_form_id: str
    kobo_field_name: str
    subindicator_id: int
    column_id: int | None
    auto_create_column: bool
    aggregation: str
    is_active: bool


# --- Sync log schemas ---

class KoboSyncLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    connection_id: int
    synced_at: datetime | None = None
    status: str
    submissions_fetched: int
    entries_created: int
    entries_updated: int
    error_message: str | None


# --- KoboToolBox API response types (for internal use) ---

class KoboFormSummary(BaseModel):
    """Subset of KoboToolBox asset list response."""
    uid: str
    name: str
    deployment_status: str | None = None
    submission_count: int | None = None
