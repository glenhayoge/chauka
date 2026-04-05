"""add public_id UUID columns to org and logframe tables

Revision ID: j5e6f7g8h9i0
Revises: i4d5e6f7g8h9
Create Date: 2026-04-05 15:00:00.000000

"""
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'j5e6f7g8h9i0'
down_revision: Union[str, None] = 'i4d5e6f7g8h9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = [
    'org_organisation',
    'org_program',
    'org_project',
    'logframe_logframe',
]


def upgrade() -> None:
    for table in TABLES:
        # Step 1: Add nullable column
        op.add_column(table, sa.Column('public_id', UUID(as_uuid=True), nullable=True))

    # Step 2: Backfill existing rows with random UUIDs
    conn = op.get_bind()
    for table in TABLES:
        rows = conn.execute(sa.text(f'SELECT id FROM {table}')).fetchall()
        for row in rows:
            conn.execute(
                sa.text(f"UPDATE {table} SET public_id = :uid WHERE id = :id"),
                {'uid': uuid4(), 'id': row[0]},
            )
        conn.commit()

    # Step 3: Set not-null, unique, and index
    for table in TABLES:
        op.alter_column(table, 'public_id', nullable=False)
        op.create_unique_constraint(f'uq_{table}_public_id', table, ['public_id'])
        op.create_index(f'ix_{table}_public_id', table, ['public_id'])


def downgrade() -> None:
    for table in TABLES:
        op.drop_index(f'ix_{table}_public_id', table_name=table)
        op.drop_constraint(f'uq_{table}_public_id', table, type_='unique')
        op.drop_column(table, 'public_id')
