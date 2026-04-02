"""add start_date, end_date, lead_id, deliverables to activity

Revision ID: a8b9c0d1e2f3
Revises: f7a8b9c0d1e2
Create Date: 2026-03-28 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8b9c0d1e2f3'
down_revision: Union[str, None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('logframe_activity', sa.Column('start_date', sa.Date(), nullable=True))
    op.add_column('logframe_activity', sa.Column('end_date', sa.Date(), nullable=True))
    op.add_column('logframe_activity', sa.Column('lead_id', sa.Integer(), nullable=True))
    op.add_column(
        'logframe_activity',
        sa.Column('deliverables', sa.Text(), server_default='', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('logframe_activity', 'deliverables')
    op.drop_column('logframe_activity', 'lead_id')
    op.drop_column('logframe_activity', 'end_date')
    op.drop_column('logframe_activity', 'start_date')
