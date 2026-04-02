"""add password reset fields to contacts_user

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-03-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("contacts_user") as batch_op:
        batch_op.add_column(
            sa.Column("password_reset_token", sa.String(64), nullable=True)
        )
        batch_op.add_column(
            sa.Column("password_reset_expires", sa.String(50), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("contacts_user") as batch_op:
        batch_op.drop_column("password_reset_expires")
        batch_op.drop_column("password_reset_token")
