"""Add appointment_files table for Cloudinary file attachments

Revision ID: 004_appointment_files
Revises: 003_payment_overhaul
Create Date: 2026-09-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004_appointment_files"
down_revision: Union[str, None] = "003_payment_overhaul"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointment_files",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("cloudinary_public_id", sa.String(length=512), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("file_type", sa.String(length=10), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["appointment_id"],
            ["appointments.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_appointment_files_id"),
        "appointment_files",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_files_appointment_id"),
        "appointment_files",
        ["appointment_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_appointment_files_appointment_id"),
        table_name="appointment_files",
    )
    op.drop_index(
        op.f("ix_appointment_files_id"),
        table_name="appointment_files",
    )
    op.drop_table("appointment_files")
