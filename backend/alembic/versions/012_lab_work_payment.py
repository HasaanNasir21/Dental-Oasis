"""Add cost and amount_paid to lab_work for payment tracking

Revision ID: 012_lab_work_payment
Revises: 011_appointment_teeth
Create Date: 2026-11-25

Adds two nullable Numeric columns to lab_work:
  - cost:        the agreed price charged by the laboratory
  - amount_paid: how much has been paid to the laboratory so far

Both default to NULL (no payment info recorded).
Pending amount = cost - amount_paid is computed at query time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "012_lab_work_payment"
down_revision: Union[str, None] = "011_appointment_teeth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "lab_work",
        sa.Column("cost", sa.Numeric(precision=10, scale=2), nullable=True),
    )
    op.add_column(
        "lab_work",
        sa.Column("amount_paid", sa.Numeric(precision=10, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("lab_work", "amount_paid")
    op.drop_column("lab_work", "cost")
