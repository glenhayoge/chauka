"""add premium indicator features (disaggregation, formulas, contribution, dynamic builder)

Revision ID: k6f7g8h9i0j1
Revises: j5e6f7g8h9i0
Create Date: 2026-04-05 18:37:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'k6f7g8h9i0j1'
down_revision: Union[str, None] = 'j5e6f7g8h9i0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Phase 1: Disaggregation
    op.create_table(
        'logframe_disaggregation_category',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('logframe_id', sa.Integer(), sa.ForeignKey('logframe_logframe.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('order', sa.Integer(), server_default='0'),
    )

    op.add_column('logframe_subindicator', sa.Column(
        'disaggregation_category_id', sa.Integer(),
        sa.ForeignKey('logframe_disaggregation_category.id'), nullable=True,
    ))
    op.add_column('logframe_subindicator', sa.Column(
        'disaggregation_value', sa.String(255), server_default='', nullable=True,
    ))

    # Phase 2: Indicator formulas
    op.add_column('logframe_indicator', sa.Column(
        'formula_config', sa.JSON(), nullable=True,
    ))
    op.add_column('logframe_indicator', sa.Column(
        'is_computed', sa.Boolean(), server_default='false', nullable=False,
    ))

    # Phase 2: DataEntry computed flag
    op.add_column('logframe_dataentry', sa.Column(
        'is_computed', sa.Boolean(), server_default='false', nullable=False,
    ))

    # Phase 3: Contribution analysis on Settings
    op.add_column('appconf_settings', sa.Column(
        'contribution_analysis_enabled', sa.Boolean(), server_default='false', nullable=False,
    ))

    # Phase 4: Dynamic builder
    op.add_column('appconf_settings', sa.Column(
        'custom_level_config', sa.JSON(), nullable=True,
    ))
    op.add_column('logframe_indicator', sa.Column(
        'measurement_type', sa.String(50), server_default='numeric', nullable=False,
    ))
    op.add_column('logframe_indicator', sa.Column(
        'unit', sa.String(50), server_default='', nullable=False,
    ))


def downgrade() -> None:
    op.drop_column('logframe_indicator', 'unit')
    op.drop_column('logframe_indicator', 'measurement_type')
    op.drop_column('appconf_settings', 'custom_level_config')
    op.drop_column('appconf_settings', 'contribution_analysis_enabled')
    op.drop_column('logframe_dataentry', 'is_computed')
    op.drop_column('logframe_indicator', 'is_computed')
    op.drop_column('logframe_indicator', 'formula_config')
    op.drop_column('logframe_subindicator', 'disaggregation_value')
    op.drop_column('logframe_subindicator', 'disaggregation_category_id')
    op.drop_table('logframe_disaggregation_category')
