"""add statusupdate model

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-03-28 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'logframe_statusupdate',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('activity_id', sa.Integer(), sa.ForeignKey('logframe_activity.id'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('contacts_user.id'), nullable=False),
        sa.Column('code_id', sa.Integer(), sa.ForeignKey('logframe_statuscode.id'), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), server_default='', nullable=False),
    )


def downgrade() -> None:
    op.drop_table('logframe_statusupdate')
