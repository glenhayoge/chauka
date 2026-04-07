"""add indicator library tables and seed curated indicators

Revision ID: l7g8h9i0j1k2
Revises: k6f7g8h9i0j1
Create Date: 2026-04-07 12:00:00.000000

"""
import json
from pathlib import Path
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'l7g8h9i0j1k2'
down_revision: Union[str, None] = 'k6f7g8h9i0j1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop if auto-created by create_tables() at startup (empty, no FK deps)
    op.execute(sa.text("DROP TABLE IF EXISTS library_indicator CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS library_indicator_sector CASCADE"))

    # Sector lookup table
    op.create_table(
        'library_indicator_sector',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
    )

    # Library indicator table
    op.create_table(
        'library_indicator',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('organisation_id', sa.Integer(), sa.ForeignKey('org_organisation.id'), nullable=True),
        sa.Column('sector', sa.String(100), nullable=False, server_default=''),
        sa.Column('result_level', sa.String(50), nullable=False, server_default=''),
        sa.Column('definition', sa.Text(), nullable=False, server_default=''),
        sa.Column('unit_of_measure', sa.String(100), nullable=False, server_default=''),
        sa.Column('calculation_method', sa.Text(), nullable=False, server_default=''),
        sa.Column('data_source', sa.String(500), nullable=False, server_default=''),
        sa.Column('data_collection_method', sa.String(255), nullable=False, server_default=''),
        sa.Column('reporting_frequency', sa.String(50), nullable=False, server_default=''),
        sa.Column('disaggregation_fields', sa.Text(), nullable=False, server_default=''),
        sa.Column('framework', sa.String(100), nullable=False, server_default=''),
        sa.Column('framework_code', sa.String(100), nullable=False, server_default=''),
        sa.Column('measurement_type', sa.String(50), nullable=False, server_default='numeric'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('contacts_user.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Indexes for search performance
    op.create_index('ix_library_indicator_sector_level', 'library_indicator', ['sector', 'result_level'])
    op.create_index('ix_library_indicator_org_id', 'library_indicator', ['organisation_id'])
    op.create_index('ix_library_indicator_name', 'library_indicator', ['name'])
    op.create_index('ix_library_indicator_framework', 'library_indicator', ['framework'])

    # Add provenance FK to existing indicator table
    op.add_column(
        'logframe_indicator',
        sa.Column('library_indicator_id', sa.Integer(), sa.ForeignKey('library_indicator.id'), nullable=True),
    )

    # Seed data from fixture
    fixture_path = Path(__file__).parent.parent.parent / 'fixtures' / 'library_indicators.json'
    if fixture_path.exists():
        with open(fixture_path) as f:
            data = json.load(f)

        sector_table = sa.table(
            'library_indicator_sector',
            sa.column('name', sa.String),
            sa.column('order', sa.Integer),
        )
        op.bulk_insert(sector_table, data['sectors'])

        indicator_table = sa.table(
            'library_indicator',
            sa.column('name', sa.String),
            sa.column('sector', sa.String),
            sa.column('result_level', sa.String),
            sa.column('definition', sa.Text),
            sa.column('unit_of_measure', sa.String),
            sa.column('calculation_method', sa.Text),
            sa.column('data_source', sa.String),
            sa.column('data_collection_method', sa.String),
            sa.column('reporting_frequency', sa.String),
            sa.column('disaggregation_fields', sa.Text),
            sa.column('framework', sa.String),
            sa.column('framework_code', sa.String),
            sa.column('measurement_type', sa.String),
        )
        op.bulk_insert(indicator_table, data['indicators'])


def downgrade() -> None:
    op.drop_column('logframe_indicator', 'library_indicator_id')
    op.drop_index('ix_library_indicator_framework', table_name='library_indicator')
    op.drop_index('ix_library_indicator_name', table_name='library_indicator')
    op.drop_index('ix_library_indicator_org_id', table_name='library_indicator')
    op.drop_index('ix_library_indicator_sector_level', table_name='library_indicator')
    op.drop_table('library_indicator')
    op.drop_table('library_indicator_sector')
