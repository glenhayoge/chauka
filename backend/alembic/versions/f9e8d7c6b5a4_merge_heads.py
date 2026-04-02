"""merge password_reset and activity_fields branches

Revision ID: f9e8d7c6b5a4
Revises: e1f2a3b4c5d6, a8b9c0d1e2f3
Create Date: 2026-04-03 08:00:00.000000

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "f9e8d7c6b5a4"
down_revision: Union[str, Sequence[str], None] = ("e1f2a3b4c5d6", "a8b9c0d1e2f3")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
