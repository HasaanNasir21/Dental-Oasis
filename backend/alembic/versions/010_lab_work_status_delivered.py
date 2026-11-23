"""Replace lab_work 'In Progress' status with 'Delivered'

Revision ID: 010_lab_work_status_delivered
Revises: 009_laboratories
Create Date: 2026-11-23

The lab work status set changes from
  Pending | In Progress | Completed
to
  Pending | Completed | Delivered

Any rows still using the now-retired "In Progress" value are moved back to
"Pending" (the work is not finished yet) before the MySQL ENUM column is
redefined to the new allowed values.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "010_lab_work_status_delivered"
down_revision: Union[str, None] = "009_laboratories"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Move rows that used the retired status back to "Pending".
    op.execute("UPDATE lab_work SET status = 'Pending' WHERE status = 'In Progress'")

    # 2. Redefine the MySQL ENUM column to the new set of allowed values.
    op.execute(
        "ALTER TABLE lab_work MODIFY COLUMN status "
        "ENUM('Pending', 'Completed', 'Delivered') NOT NULL"
    )


def downgrade() -> None:
    # Move any "Delivered" rows back to "Pending" before restoring the old ENUM.
    op.execute("UPDATE lab_work SET status = 'Pending' WHERE status = 'Delivered'")

    op.execute(
        "ALTER TABLE lab_work MODIFY COLUMN status "
        "ENUM('Pending', 'In Progress', 'Completed') NOT NULL"
    )
