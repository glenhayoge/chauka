"""add description to milestone

Revision ID: g1a2b3c4d5e6
Revises: f9e8d7c6b5a4
Create Date: 2026-04-04 07:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "g1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "h2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("logframe_milestone", sa.Column("description", sa.String(500), server_default="", nullable=False))


def downgrade() -> None:
    op.drop_column("logframe_milestone", "description")
