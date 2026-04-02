"""add taline model

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-03-28 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'logframe_taline',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('activity_id', sa.Integer(), sa.ForeignKey('logframe_activity.id'), nullable=False),
        sa.Column('type', sa.String(255), server_default='', nullable=False),
        sa.Column('name', sa.String(255), server_default='', nullable=False),
        sa.Column('band', sa.String(10), server_default='', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('no_days', sa.Integer(), server_default='0', nullable=False),
        sa.Column('amount', sa.Float(), server_default='0.0', nullable=False),
    )


def downgrade() -> None:
    op.drop_table('logframe_taline')
