"""add level_labels to settings

Revision ID: h3c4d5e6f7g8
Revises: g1a2b3c4d5e6
Create Date: 2026-04-04 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "h3c4d5e6f7g8"
down_revision: Union[str, Sequence[str], None] = "g1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("appconf_settings", sa.Column("level_labels", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("appconf_settings", "level_labels")
