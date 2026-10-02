"""Add treatments (multi-treatment JSON) and last_payment_date to appointments

Revision ID: 005_multi_treatments_payment_date
Revises: 004_appointment_files
Create Date: 2026-10-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005_treatments_payment_date"
down_revision: Union[str, None] = "004_appointment_files"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Store multiple treatments as a JSON-encoded list.
    # Nullable — existing appointments keep using `reason` alone.
    op.add_column(
        "appointments",
        sa.Column("treatments", sa.Text(), nullable=True),
    )

    # Date when amount_paid was last recorded — used for monthly revenue bucketing.
    # Revenue is attributed to the month this date falls in, not appointment_date.
    op.add_column(
        "appointments",
        sa.Column("last_payment_date", sa.Date(), nullable=True),
    )
    op.create_index(
        "ix_appointments_last_payment_date",
        "appointments",
        ["last_payment_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_appointments_last_payment_date", table_name="appointments")
    op.drop_column("appointments", "last_payment_date")
    op.drop_column("appointments", "treatments")
