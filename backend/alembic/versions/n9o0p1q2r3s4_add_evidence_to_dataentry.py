"""add evidence column to dataentry

Revision ID: n9o0p1q2r3s4
Revises: m8n9o0p1q2r3
Create Date: 2026-04-11

"""
import sqlalchemy as sa
from alembic import op

revision: str = "n9o0p1q2r3s4"
down_revision: str = "m8n9o0p1q2r3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "logframe_dataentry",
        sa.Column("evidence", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("logframe_dataentry", "evidence")
