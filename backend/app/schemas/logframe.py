from datetime import date as date_type
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.security.sanitize import sanitize_html


class LogframeBase(BaseModel):
    name: str
    project_id: int | None = None
    program_id: int | None = None


class LogframeRead(LogframeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: UUID


class ResultBase(BaseModel):
    name: str = ""
    description: str = ""
    order: int = 0
    level: int | None = None
    logframe_id: int
    parent_id: int | None = None
    rating_id: int | None = None
    contribution_weighting: int = 100


class ResultCreate(BaseModel):
    name: str = ""
    description: str = ""
    level: int | None = None
    parent_id: int | None = None
    rating_id: int | None = None
    contribution_weighting: int = 100

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class ResultUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order: int | None = None
    level: int | None = None
    parent_id: int | None = None
    rating_id: int | None = None
    contribution_weighting: int | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class ResultRead(ResultBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class IndicatorBase(BaseModel):
    name: str = ""
    description: str = ""
    order: int = 0
    result_id: int
    source_of_verification: str = ""
    needs_baseline: bool = True
    formula_config: dict | None = None
    is_computed: bool = False
    measurement_type: str = "numeric"
    unit: str = ""


class IndicatorCreate(IndicatorBase):
    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class IndicatorUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order: int | None = None
    source_of_verification: str | None = None
    needs_baseline: bool | None = None
    formula_config: dict | None = None
    is_computed: bool | None = None
    measurement_type: str | None = None
    unit: str | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class IndicatorRead(IndicatorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SubIndicatorBase(BaseModel):
    name: str = ""
    order: int = 0
    indicator_id: int
    disaggregation_category_id: int | None = None
    disaggregation_value: str = ""


class SubIndicatorCreate(SubIndicatorBase):
    pass


class SubIndicatorUpdate(BaseModel):
    name: str | None = None
    order: int | None = None
    disaggregation_category_id: int | None = None
    disaggregation_value: str | None = None


class SubIndicatorRead(SubIndicatorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class DisaggregationCategoryCreate(BaseModel):
    name: str
    order: int = 0


class DisaggregationCategoryUpdate(BaseModel):
    name: str | None = None
    order: int | None = None


class DisaggregationCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    logframe_id: int
    name: str
    order: int


class ActivityBase(BaseModel):
    name: str = ""
    description: str = ""
    order: int = 0
    result_id: int
    start_date: date_type | None = None
    end_date: date_type | None = None
    lead_id: int | None = None
    deliverables: str = ""


class ActivityCreate(BaseModel):
    name: str = ""
    description: str = ""
    start_date: date_type | None = None
    end_date: date_type | None = None
    lead_id: int | None = None
    deliverables: str = ""

    @field_validator("description", "deliverables", mode="before")
    @classmethod
    def sanitize_html_fields(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class ActivityUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order: int | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None
    lead_id: int | None = None
    deliverables: str | None = None

    @field_validator("description", "deliverables", mode="before")
    @classmethod
    def sanitize_html_fields(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class ActivityRead(ActivityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ColumnBase(BaseModel):
    name: str
    logframe_id: int


class ColumnCreate(BaseModel):
    name: str


class ColumnUpdate(BaseModel):
    name: str | None = None


class ColumnRead(ColumnBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class DataEntryBase(BaseModel):
    data: str | None = None
    subindicator_id: int
    column_id: int


class DataEntryCreate(DataEntryBase):
    pass


class DataEntryUpdate(BaseModel):
    data: str | None = None


class DataEntryRead(DataEntryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class RatingBase(BaseModel):
    name: str
    color: str = "#9ca3af"
    logframe_id: int


class RatingCreate(RatingBase):
    pass


class RatingUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class RatingRead(RatingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class RiskRatingBase(BaseModel):
    name: str
    logframe_id: int


class RiskRatingCreate(RiskRatingBase):
    pass


class RiskRatingRead(RiskRatingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class AssumptionBase(BaseModel):
    description: str = ""
    result_id: int
    risk_rating_id: int | None = None


class AssumptionCreate(BaseModel):
    description: str = ""
    risk_rating_id: int | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class AssumptionUpdate(BaseModel):
    description: str | None = None
    risk_rating_id: int | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class AssumptionRead(AssumptionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BudgetLineBase(BaseModel):
    name: str = ""
    amount: float = 0.0
    category: str = ""
    activity_id: int


class BudgetLineCreate(BaseModel):
    name: str = ""
    amount: float = 0.0
    category: str = ""


class BudgetLineUpdate(BaseModel):
    name: str | None = None
    amount: float | None = None
    category: str | None = None


class BudgetLineRead(BudgetLineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class MilestoneBase(BaseModel):
    activity_id: int
    period_id: int | None = None
    description: str = ""


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    period_id: int | None = None
    description: str | None = None


class MilestoneRead(MilestoneBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TagBase(BaseModel):
    name: str
    logframe_id: int


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class IndicatorTagBase(BaseModel):
    indicator_id: int
    tag_id: int


class IndicatorTagCreate(IndicatorTagBase):
    pass


class IndicatorTagRead(IndicatorTagBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PeriodBase(BaseModel):
    start_month: int
    start_year: int
    end_month: int
    end_year: int
    logframe_id: int


class PeriodCreate(PeriodBase):
    pass


class PeriodRead(PeriodBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ReportingPeriodBase(BaseModel):
    period_id: int
    subindicator_id: int
    value: str | None = None
    status: str = "OK"


class ReportingPeriodCreate(ReportingPeriodBase):
    pass


class ReportingPeriodUpdate(BaseModel):
    value: str | None = None
    status: str | None = None


class ReportingPeriodRead(ReportingPeriodBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class StatusCodeBase(BaseModel):
    name: str
    description: str = ""
    logframe_id: int


class StatusCodeCreate(StatusCodeBase):
    pass


class StatusCodeRead(StatusCodeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TargetBase(BaseModel):
    indicator_id: int
    subindicator_id: int
    milestone_id: int
    value: str | None = None


class TargetCreate(TargetBase):
    pass


class TargetUpdate(BaseModel):
    value: str | None = None


class TargetRead(TargetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TALineBase(BaseModel):
    activity_id: int
    type: str = ""
    name: str = ""
    band: str = ""
    start_date: date_type | None = None
    end_date: date_type | None = None
    no_days: int = 0
    amount: float = 0.0


class TALineCreate(TALineBase):
    pass


class TALineUpdate(BaseModel):
    type: str | None = None
    name: str | None = None
    band: str | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None
    no_days: int | None = None
    amount: float | None = None


class TALineRead(TALineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class StatusUpdateBase(BaseModel):
    activity_id: int
    code_id: int | None = None
    date: date_type
    description: str = ""


class StatusUpdateCreate(StatusUpdateBase):
    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class StatusUpdateUpdate(BaseModel):
    code_id: int | None = None
    date: date_type | None = None
    description: str | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class StatusUpdateRead(StatusUpdateBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int


class ExpenseBase(BaseModel):
    budget_line_id: int
    amount: float = 0.0
    description: str = ""
    date: date_type


class ExpenseCreate(BaseModel):
    budget_line_id: int
    amount: float
    description: str = ""
    date: date_type

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v) if v else v


class ExpenseUpdate(BaseModel):
    amount: float | None = None
    description: str | None = None
    date: date_type | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v


class ExpenseRead(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int | None = None


class ResourceCreate(BaseModel):
    resource_type: str  # human, equipment, partner
    role: str = ""
    person: str = ""
    resource_name: str = ""
    organisation_name: str = ""
    role_in_activity: str = ""
    quantity: int = 1
    days_required: int = 0
    allocation_pct: int | None = None


class ResourceUpdate(BaseModel):
    role: str | None = None
    person: str | None = None
    resource_name: str | None = None
    organisation_name: str | None = None
    role_in_activity: str | None = None
    quantity: int | None = None
    days_required: int | None = None
    allocation_pct: int | None = None


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    activity_id: int
    resource_type: str
    role: str
    person: str
    resource_name: str
    organisation_name: str
    role_in_activity: str
    quantity: int
    days_required: int
    allocation_pct: int | None


class SettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    logframe_id: int
    name: str
    description: str
    start_month: int
    start_year: int
    end_year: int
    n_periods: int
    currency: str
    max_result_level: int
    open_result_level: int
    use_components: bool = False
    level_labels: dict[str, str] | None = None


class SettingsUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_month: int | None = None
    start_year: int | None = None
    end_year: int | None = None
    n_periods: int | None = None
    currency: str | None = None
    max_result_level: int | None = None
    open_result_level: int | None = None
    use_components: bool | None = None
    level_labels: dict[str, str] | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        return sanitize_html(v) if v else v
