export interface User {
  id: number
  username: string
  is_staff: boolean
}

export interface UserSummary {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface Organisation {
  id: number
  name: string
  slug: string
  description: string
  logo_url: string
  country: string
  org_type: string
  sector: string
  owner_id: number
  created_at: string
  updated_at: string
}

export interface OrganisationCreate {
  name: string
  slug: string
  description?: string
  logo_url?: string
  country?: string
  org_type?: string
  sector?: string
}

export interface Program {
  id: number
  name: string
  description: string
  organisation_id: number
  start_date: string | null
  end_date: string | null
}

export interface ProgramCreate {
  name: string
  description?: string
  start_date?: string | null
  end_date?: string | null
}

export interface Project {
  id: number
  name: string
  description: string
  program_id: number | null
  organisation_id: number | null
  start_date: string | null
  end_date: string | null
  status: 'active' | 'completed' | 'archived'
}

export interface ProjectCreate {
  name: string
  description?: string
  start_date?: string | null
  end_date?: string | null
  status?: 'active' | 'completed' | 'archived'
}

export interface Logframe {
  id: number
  name: string
  project_id: number | null
  program_id: number | null
}

export interface Result {
  id: number
  name: string
  description: string
  order: number
  level: number | null
  logframe_id: number
  parent_id: number | null
  rating_id: number | null
  contribution_weighting: number
}

export interface Indicator {
  id: number
  name: string
  description: string
  order: number
  result_id: number
  source_of_verification: string
  needs_baseline: boolean
}

export interface SubIndicator {
  id: number
  name: string
  order: number
  indicator_id: number
}

export interface Activity {
  id: number
  name: string
  description: string
  order: number
  result_id: number
  start_date: string | null
  end_date: string | null
  lead_id: number | null
  deliverables: string
}

export interface Column {
  id: number
  name: string
  logframe_id: number
}

export interface DataEntry {
  id: number
  data: string | null
  subindicator_id: number
  column_id: number
}

export interface Rating {
  id: number
  name: string
  color: string
  logframe_id: number
}

export interface RiskRating {
  id: number
  name: string
  logframe_id: number
}

export interface Assumption {
  id: number
  description: string
  result_id: number
  risk_rating_id: number | null
}

export interface Resource {
  id: number
  activity_id: number
  resource_type: 'human' | 'equipment' | 'partner'
  role: string
  person: string
  resource_name: string
  organisation_name: string
  role_in_activity: string
  quantity: number
  days_required: number
  allocation_pct: number | null
}

export interface BudgetLine {
  id: number
  name: string
  amount: number
  category: string
  activity_id: number
}

export interface Milestone {
  id: number
  activity_id: number
  period_id: number | null
}

export interface TALine {
  id: number
  activity_id: number
  type: string
  name: string
  band: string
  start_date: string | null
  end_date: string | null
  no_days: number
  amount: number
}

export interface StatusUpdate {
  id: number
  activity_id: number
  user_id: number
  code_id: number | null
  date: string
  description: string
}

export interface StatusCode {
  id: number
  name: string
  description: string
  logframe_id: number
}

export interface Tag {
  id: number
  name: string
  logframe_id: number
}

export interface IndicatorTag {
  id: number
  indicator_id: number
  tag_id: number
}

export interface Period {
  id: number
  start_month: number
  start_year: number
  end_month: number
  end_year: number
  logframe_id: number
}

export interface Target {
  id: number
  indicator_id: number
  subindicator_id: number
  milestone_id: number
  value: string | null
}

export interface ReportingPeriod {
  id: number
  period_id: number
  subindicator_id: number
  value: string | null
  status: 'OK' | 'WARNING' | 'DANGER'
}

export interface AppSettings {
  id: number
  logframe_id: number
  name: string
  description: string
  start_month: number
  start_year: number
  end_year: number
  n_periods: number
  currency: string
  max_result_level: number
  open_result_level: number
  use_components: boolean
}

export interface BootstrapConf {
  max_result_level: number
  open_result_level: number
  use_components: boolean
}

export interface Expense {
  id: number
  budget_line_id: number
  amount: number
  description: string
  date: string
  user_id: number | null
}

// --- RBAC types ---

export type OrgRole = 'admin' | 'member'
export type ProjectRoleType = 'lead' | 'collector' | 'viewer'

export interface OrganisationMembership {
  id: number
  user_id: number
  organisation_id: number
  role: OrgRole
  created_at: string
}

export interface OrganisationMembershipCreate {
  user_id: number
  role?: OrgRole
}

export interface ProjectRoleAssignment {
  id: number
  user_id: number
  project_id: number
  role: ProjectRoleType
  created_at: string
}

export interface ProjectRoleCreate {
  user_id: number
  role?: ProjectRoleType
}

export interface Invitation {
  id: number
  organisation_id: number
  email: string
  role: string
  token: string
  created_by: number
  accepted: boolean
}

export interface InvitationPublic {
  organisation_name: string
  email: string
  role: string
  accepted: boolean
}

export interface BootstrapData {
  logframe: Logframe
  results: Result[]
  indicators: Indicator[]
  subIndicators: SubIndicator[]
  activities: Activity[]
  columns: Column[]
  dataEntries: DataEntry[]
  ratings: Rating[]
  riskRatings: RiskRating[]
  assumptions: Assumption[]
  budgetLines: BudgetLine[]
  milestones: Milestone[]
  targets?: Target[]
  taLines?: TALine[]
  expenses?: Expense[]
  resources?: Resource[]
  statusUpdates?: StatusUpdate[]
  statusCodes: StatusCode[]
  tags: Tag[]
  indicatorTags: IndicatorTag[]
  periods: Period[]
  reportingPeriods: ReportingPeriod[]
  settings: AppSettings | null
  levels: Record<string, string>
  conf: BootstrapConf
  canEdit: boolean
  userRole: 'admin' | 'lead' | 'collector' | 'viewer' | null
  orgContext: {
    organisation: Organisation
    program: Program | null
    project: Project | null
  } | null
}

// --- Audit Log types ---

export interface AuditLogEntry {
  id: number
  user_id: number
  action: string
  entity_type: string
  entity_id: number
  changes: string
  logframe_id: number | null
  timestamp: string
}

// --- Notification types ---

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

// --- KoboToolBox integration types ---

export interface KoboConnection {
  id: number
  logframe_id: number
  server_url: string
  is_active: boolean
  created_at: string | null
}

export interface KoboFieldMapping {
  id: number
  connection_id: number
  kobo_form_id: string
  kobo_field_name: string
  subindicator_id: number
  column_id: number | null
  auto_create_column: boolean
  aggregation: string
  is_active: boolean
}

export interface KoboFormSummary {
  uid: string
  name: string
  deployment_status: string | null
  submission_count: number | null
}

export interface KoboFormField {
  name: string
  label: string
  type: string
}

export interface KoboSyncLog {
  id: number
  connection_id: number
  synced_at: string | null
  status: string
  submissions_fetched: number
  entries_created: number
  entries_updated: number
  error_message: string | null
}
