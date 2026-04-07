from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.security.sanitize import sanitize_html


class LibraryIndicatorBase(BaseModel):
    name: str
    sector: str = ""
    result_level: str = ""
    definition: str = ""
    unit_of_measure: str = ""
    calculation_method: str = ""
    data_source: str = ""
    data_collection_method: str = ""
    reporting_frequency: str = ""
    disaggregation_fields: str = ""
    framework: str = ""
    framework_code: str = ""
    measurement_type: str = "numeric"


class LibraryIndicatorCreate(LibraryIndicatorBase):
    organisation_id: int

    @field_validator("definition", mode="before")
    @classmethod
    def sanitize_definition(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class LibraryIndicatorUpdate(BaseModel):
    name: str | None = None
    sector: str | None = None
    result_level: str | None = None
    definition: str | None = None
    unit_of_measure: str | None = None
    calculation_method: str | None = None
    data_source: str | None = None
    data_collection_method: str | None = None
    reporting_frequency: str | None = None
    disaggregation_fields: str | None = None
    framework: str | None = None
    framework_code: str | None = None
    measurement_type: str | None = None

    @field_validator("definition", mode="before")
    @classmethod
    def sanitize_definition(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class LibraryIndicatorRead(LibraryIndicatorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    organisation_id: int | None = None
    is_active: bool
    created_at: datetime | None = None


class LibraryIndicatorSearchResult(BaseModel):
    items: list[LibraryIndicatorRead]
    total: int
    page: int
    page_size: int


class UseLibraryIndicatorRequest(BaseModel):
    logframe_public_id: str
    result_id: int


class SectorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    order: int
