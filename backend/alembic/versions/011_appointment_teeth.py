"""Add teeth column to appointments

Revision ID: 011_appointment_teeth
Revises: 010_lab_work_status_delivered
Create Date: 2026-11-23

Adds a nullable `teeth` text column to the appointments table so staff can
record the FDI tooth numbers involved in a visit (mirrors lab_work.teeth).
Stored as a JSON array string, e.g. ["16","17","26","27"]. Existing rows get
NULL, which the model reads back as an empty list.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "011_appointment_teeth"
down_revision: Union[str, None] = "010_lab_work_status_delivered"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("teeth", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("appointments", "teeth")
