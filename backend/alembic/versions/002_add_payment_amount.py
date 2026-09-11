"""add payment_amount to appointments

Revision ID: 002_add_payment_amount
Revises: 001_initial
Create Date: 2026-09-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_add_payment_amount"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("payment_amount", sa.Numeric(10, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("appointments", "payment_amount")
