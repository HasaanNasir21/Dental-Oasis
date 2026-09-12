"""Payment overhaul: rename payment_amount→amount_paid, add total_amount, create monthly_payment_summaries

Revision ID: 003_payment_overhaul
Revises: 002_add_payment_amount
Create Date: 2026-09-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003_payment_overhaul"
down_revision: Union[str, None] = "002_add_payment_amount"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Rename payment_amount → amount_paid on appointments
    op.alter_column(
        "appointments",
        "payment_amount",
        new_column_name="amount_paid",
        existing_type=sa.Numeric(10, 2),
        existing_nullable=True,
    )

    # 2. Add total_amount column to appointments
    op.add_column(
        "appointments",
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=True),
    )

    # 3. Create monthly_payment_summaries table
    op.create_table(
        "monthly_payment_summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column("patient_name", sa.String(length=255), nullable=False),
        sa.Column("total_charged", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total_paid", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total_pending", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("appointment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_monthly_payment_summaries_id"), "monthly_payment_summaries", ["id"], unique=False)
    op.create_index(op.f("ix_monthly_payment_summaries_client_id"), "monthly_payment_summaries", ["client_id"], unique=False)
    op.create_index(
        "ix_monthly_payment_summaries_year_month",
        "monthly_payment_summaries",
        ["year", "month"],
        unique=False,
    )
    # Unique: one summary row per (client_id OR patient_name) per year+month
    op.create_index(
        "ix_monthly_payment_summaries_unique_client_period",
        "monthly_payment_summaries",
        ["client_id", "year", "month"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_monthly_payment_summaries_unique_client_period", table_name="monthly_payment_summaries")
    op.drop_index("ix_monthly_payment_summaries_year_month", table_name="monthly_payment_summaries")
    op.drop_index(op.f("ix_monthly_payment_summaries_client_id"), table_name="monthly_payment_summaries")
    op.drop_index(op.f("ix_monthly_payment_summaries_id"), table_name="monthly_payment_summaries")
    op.drop_table("monthly_payment_summaries")

    op.drop_column("appointments", "total_amount")

    op.alter_column(
        "appointments",
        "amount_paid",
        new_column_name="payment_amount",
        existing_type=sa.Numeric(10, 2),
        existing_nullable=True,
    )
