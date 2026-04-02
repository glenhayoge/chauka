"""add target model

Revision ID: c4d5e6f7a8b9
Revises: b3f1a2c4d5e6
Create Date: 2026-03-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'b3f1a2c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'logframe_target',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('indicator_id', sa.Integer(), sa.ForeignKey('logframe_indicator.id'), nullable=False),
        sa.Column('subindicator_id', sa.Integer(), sa.ForeignKey('logframe_subindicator.id'), nullable=False),
        sa.Column('milestone_id', sa.Integer(), sa.ForeignKey('logframe_period.id'), nullable=False),
        sa.Column('value', sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('logframe_target')
