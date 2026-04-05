"""add permission and role_permission tables

Revision ID: i4d5e6f7g8h9
Revises: 017283ce0a10
Create Date: 2026-04-05 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i4d5e6f7g8h9'
down_revision: Union[str, None] = '017283ce0a10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admin_permission',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('codename', sa.String(100), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), server_default=''),
        sa.Column('category', sa.String(50), server_default='general'),
    )
    op.create_index('ix_admin_permission_codename', 'admin_permission', ['codename'])

    op.create_table(
        'admin_role_permission',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('permission_id', sa.Integer(), sa.ForeignKey('admin_permission.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('role', 'permission_id', name='uq_role_perm'),
    )
    op.create_index('ix_admin_role_permission_role', 'admin_role_permission', ['role'])


def downgrade() -> None:
    op.drop_table('admin_role_permission')
    op.drop_table('admin_permission')
