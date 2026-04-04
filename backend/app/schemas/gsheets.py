"""Pydantic schemas for Google Sheets integration endpoints."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


# --- Connection schemas ---

class GoogleSheetsConnectionCreate(BaseModel):
    spreadsheet_id: str
    sheet_name: str | None = None
    service_account_json: str


class GoogleSheetsConnectionUpdate(BaseModel):
    spreadsheet_id: str | None = None
    sheet_name: str | None = None
    service_account_json: str | None = None
    is_active: bool | None = None


class GoogleSheetsConnectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    logframe_id: int
    spreadsheet_id: str
    sheet_name: str | None
    is_active: bool
    created_at: datetime | None = None


# --- Column mapping schemas ---

class GoogleSheetsColumnMappingCreate(BaseModel):
    sheet_column: str
    subindicator_id: int
    column_id: int | None = None
    auto_create_column: bool = False
    aggregation: str = "latest"


class GoogleSheetsColumnMappingUpdate(BaseModel):
    sheet_column: str | None = None
    subindicator_id: int | None = None
    column_id: int | None = None
    auto_create_column: bool | None = None
    aggregation: str | None = None
    is_active: bool | None = None


class GoogleSheetsColumnMappingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    connection_id: int
    sheet_column: str
    subindicator_id: int
    column_id: int | None
    auto_create_column: bool
    aggregation: str
    is_active: bool


# --- Sync log schemas ---

class GoogleSheetsSyncLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    connection_id: int
    synced_at: datetime | None = None
    status: str
    rows_fetched: int
    entries_created: int
    entries_updated: int
    error_message: str | None


# --- Sheet discovery types ---

class GoogleSheetsSheetInfo(BaseModel):
    """Info about a sheet (tab) within a spreadsheet."""
    title: str
    index: int
    row_count: int
    column_count: int


class GoogleSheetsColumnInfo(BaseModel):
    """A column header from the first row of a sheet."""
    letter: str
    header: str
