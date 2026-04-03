"""backfill admin memberships for org owners

Revision ID: h2b3c4d5e6f7
Revises: f9e8d7c6b5a4
Create Date: 2026-04-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "h2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "f9e8d7c6b5a4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert an admin membership for every org owner who doesn't already have one.
    op.execute(
        sa.text("""
            INSERT INTO org_membership (user_id, organisation_id, role, created_at)
            SELECT o.owner_id, o.id, 'admin', NOW()
            FROM org_organisation o
            WHERE NOT EXISTS (
                SELECT 1 FROM org_membership m
                WHERE m.user_id = o.owner_id
                  AND m.organisation_id = o.id
            )
        """)
    )


def downgrade() -> None:
    # We can't reliably distinguish backfilled rows from manually-added ones,
    # so downgrade is a no-op. The extra membership rows are harmless.
    pass
