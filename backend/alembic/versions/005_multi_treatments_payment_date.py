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
    # Widen the alembic_version tracking column — older installs use VARCHAR(32)
    # which is too short for revision IDs longer than 32 characters.
    # This is safe to run even if the column is already wider.
    op.execute("ALTER TABLE alembic_version MODIFY version_num VARCHAR(64) NOT NULL")

    # Add columns only if they don't already exist (idempotent — safe to re-run
    # if a previous deployment partially applied this migration before failing).
    conn = op.get_bind()

    existing = {
        row[0]
        for row in conn.execute(
            sa.text("SHOW COLUMNS FROM appointments")
        )
    }

    if "treatments" not in existing:
        op.add_column(
            "appointments",
            sa.Column("treatments", sa.Text(), nullable=True),
        )

    if "last_payment_date" not in existing:
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

    # Backfill last_payment_date for existing appointments that already have
    # amount_paid recorded. Use DATE(updated_at) as the best proxy for when
    # the payment was actually entered — this preserves the correct month
    # attribution for all historical data.
    conn.execute(sa.text("""
        UPDATE appointments
        SET last_payment_date = DATE(updated_at)
        WHERE amount_paid IS NOT NULL
          AND amount_paid > 0
          AND last_payment_date IS NULL
    """))


def downgrade() -> None:
    op.drop_index("ix_appointments_last_payment_date", table_name="appointments")
    op.drop_column("appointments", "last_payment_date")
    op.drop_column("appointments", "treatments")
