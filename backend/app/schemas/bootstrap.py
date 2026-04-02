from pydantic import BaseModel


class BootstrapConf(BaseModel):
    """Per-logframe configuration derived from settings."""
    max_result_level: int
    open_result_level: int
    use_components: bool = False


class BootstrapData(BaseModel):
    """Matches the Aptivate.data shape injected by Django templates."""
    logframe: dict
    results: list[dict]
    indicators: list[dict]
    subIndicators: list[dict]
    activities: list[dict]
    columns: list[dict]
    dataEntries: list[dict]
    ratings: list[dict]
    riskRatings: list[dict]
    assumptions: list[dict]
    budgetLines: list[dict]
    milestones: list[dict]
    targets: list[dict]
    taLines: list[dict]
    expenses: list[dict]
    resources: list[dict]
    statusUpdates: list[dict]
    statusCodes: list[dict]
    tags: list[dict]
    indicatorTags: list[dict]
    periods: list[dict]
    reportingPeriods: list[dict]
    settings: dict | None
    levels: dict[str, str]
    conf: BootstrapConf
    canEdit: bool
    userRole: str | None = None
    orgContext: dict | None = None
