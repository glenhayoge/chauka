"""add max_result_level and open_result_level to settings

Revision ID: b3f1a2c4d5e6
Revises: a550a71c11de
Create Date: 2026-03-27 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3f1a2c4d5e6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appconf_settings', sa.Column('max_result_level', sa.SmallInteger(), server_default='3', nullable=False))
    op.add_column('appconf_settings', sa.Column('open_result_level', sa.SmallInteger(), server_default='0', nullable=False))


def downgrade() -> None:
    with op.batch_alter_table('appconf_settings') as batch_op:
        batch_op.drop_column('open_result_level')
        batch_op.drop_column('max_result_level')
