"""add FK indexes

Revision ID: m8n9o0p1q2r3
Revises: l7g8h9i0j1k2
Create Date: 2026-04-10

"""
from alembic import op

revision: str = "m8n9o0p1q2r3"
down_revision: str = "l7g8h9i0j1k2"
branch_labels = None
depends_on = None

# (index_name, table_name, column_name)
_INDEXES = [
    # --- logframe models ---
    ("ix_logframe_project_id", "logframe_logframe", "project_id"),
    ("ix_logframe_program_id", "logframe_logframe", "program_id"),
    ("ix_result_logframe_id", "logframe_result", "logframe_id"),
    ("ix_result_parent_id", "logframe_result", "parent_id"),
    ("ix_result_rating_id", "logframe_result", "rating_id"),
    ("ix_indicator_result_id", "logframe_indicator", "result_id"),
    ("ix_subindicator_indicator_id", "logframe_subindicator", "indicator_id"),
    ("ix_subindicator_disagg_cat_id", "logframe_subindicator", "disaggregation_category_id"),
    ("ix_activity_result_id", "logframe_activity", "result_id"),
    ("ix_activity_lead_id", "logframe_activity", "lead_id"),
    ("ix_column_logframe_id", "logframe_column", "logframe_id"),
    ("ix_dataentry_subindicator_id", "logframe_dataentry", "subindicator_id"),
    ("ix_dataentry_column_id", "logframe_dataentry", "column_id"),
    ("ix_budgetline_activity_id", "logframe_budgetline", "activity_id"),
    ("ix_milestone_activity_id", "logframe_milestone", "activity_id"),
    ("ix_milestone_period_id", "logframe_milestone", "period_id"),
    ("ix_statusupdate_activity_id", "logframe_statusupdate", "activity_id"),
    ("ix_statusupdate_user_id", "logframe_statusupdate", "user_id"),
    ("ix_statusupdate_code_id", "logframe_statusupdate", "code_id"),
    ("ix_expense_budget_line_id", "logframe_expense", "budget_line_id"),
    ("ix_expense_user_id", "logframe_expense", "user_id"),
    ("ix_resource_activity_id", "logframe_resource", "activity_id"),
    ("ix_assumption_result_id", "logframe_assumption", "result_id"),
    ("ix_assumption_risk_rating_id", "logframe_assumption", "risk_rating_id"),
    ("ix_rating_logframe_id", "logframe_rating", "logframe_id"),
    ("ix_riskrating_logframe_id", "logframe_riskrating", "logframe_id"),
    ("ix_statuscode_logframe_id", "logframe_statuscode", "logframe_id"),
    ("ix_tag_logframe_id", "logframe_tag", "logframe_id"),
    ("ix_indicatortag_indicator_id", "logframe_indicatortag", "indicator_id"),
    ("ix_indicatortag_tag_id", "logframe_indicatortag", "tag_id"),
    ("ix_period_logframe_id", "logframe_period", "logframe_id"),
    ("ix_reportingperiod_period_id", "logframe_reportingperiod", "period_id"),
    ("ix_reportingperiod_subindicator_id", "logframe_reportingperiod", "subindicator_id"),
    ("ix_target_indicator_id", "logframe_target", "indicator_id"),
    ("ix_target_subindicator_id", "logframe_target", "subindicator_id"),
    ("ix_target_milestone_id", "logframe_target", "milestone_id"),
    ("ix_taline_activity_id", "logframe_taline", "activity_id"),
    ("ix_disagg_cat_logframe_id", "logframe_disaggregation_category", "logframe_id"),
    # --- org models ---
    ("ix_organisation_owner_id", "org_organisation", "owner_id"),
    ("ix_program_organisation_id", "org_program", "organisation_id"),
    ("ix_project_program_id", "org_project", "program_id"),
    ("ix_project_organisation_id", "org_project", "organisation_id"),
    ("ix_membership_user_id", "org_membership", "user_id"),
    ("ix_membership_organisation_id", "org_membership", "organisation_id"),
    ("ix_project_role_user_id", "org_project_role", "user_id"),
    ("ix_project_role_project_id", "org_project_role", "project_id"),
    ("ix_invitation_organisation_id", "org_invitation", "organisation_id"),
    ("ix_invitation_created_by", "org_invitation", "created_by"),
    ("ix_invitation_accepted_by", "org_invitation", "accepted_by"),
    # --- appconf ---
    ("ix_settings_logframe_id", "appconf_settings", "logframe_id"),
    # --- audit ---
    ("ix_auditlog_user_id", "audit_log", "user_id"),
    ("ix_auditlog_logframe_id", "audit_log", "logframe_id"),
    # --- indicator library ---
    ("ix_library_indicator_created_by", "library_indicator", "created_by_id"),
    # --- kobo ---
    ("ix_kobo_connection_logframe_id", "kobo_connection", "logframe_id"),
    ("ix_kobo_mapping_connection_id", "kobo_field_mapping", "connection_id"),
    ("ix_kobo_mapping_subindicator_id", "kobo_field_mapping", "subindicator_id"),
    ("ix_kobo_mapping_column_id", "kobo_field_mapping", "column_id"),
    ("ix_kobo_synclog_connection_id", "kobo_sync_log", "connection_id"),
    # --- gsheets ---
    ("ix_gsheets_connection_logframe_id", "gsheets_connection", "logframe_id"),
    ("ix_gsheets_mapping_connection_id", "gsheets_column_mapping", "connection_id"),
    ("ix_gsheets_mapping_subindicator_id", "gsheets_column_mapping", "subindicator_id"),
    ("ix_gsheets_mapping_column_id", "gsheets_column_mapping", "column_id"),
    ("ix_gsheets_synclog_connection_id", "gsheets_sync_log", "connection_id"),
    # --- permission ---
    ("ix_role_permission_permission_id", "admin_role_permission", "permission_id"),
]


def upgrade() -> None:
    for name, table, column in _INDEXES:
        op.create_index(name, table, [column])


def downgrade() -> None:
    for name, table, _column in _INDEXES:
        op.drop_index(name, table_name=table)
