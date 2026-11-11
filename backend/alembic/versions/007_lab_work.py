"""Add lab_work table for dental laboratory work tracking

Revision ID: 007_lab_work
Revises: 006_employee_payments
Create Date: 2026-11-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "007_lab_work"
down_revision: Union[str, None] = "006_employee_payments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "lab_work",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_name", sa.String(length=255), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column(
            "work_type",
            sa.Enum("PFM", "Zirconia", "E-Max", "Dentures", "Other", name="labworktype"),
            nullable=False,
        ),
        sa.Column("teeth", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("Pending", "In Progress", "Completed", name="labworkstatus"),
            nullable=False,
        ),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lab_work_id"), "lab_work", ["id"], unique=False)
    op.create_index(op.f("ix_lab_work_patient_name"), "lab_work", ["patient_name"], unique=False)
    op.create_index(op.f("ix_lab_work_client_id"), "lab_work", ["client_id"], unique=False)
    op.create_index(op.f("ix_lab_work_work_type"), "lab_work", ["work_type"], unique=False)
    op.create_index(op.f("ix_lab_work_status"), "lab_work", ["status"], unique=False)
    op.create_index(op.f("ix_lab_work_work_date"), "lab_work", ["work_date"], unique=False)
    op.create_index("ix_lab_work_date_type", "lab_work", ["work_date", "work_type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_lab_work_date_type", table_name="lab_work")
    op.drop_index(op.f("ix_lab_work_work_date"), table_name="lab_work")
    op.drop_index(op.f("ix_lab_work_status"), table_name="lab_work")
    op.drop_index(op.f("ix_lab_work_work_type"), table_name="lab_work")
    op.drop_index(op.f("ix_lab_work_client_id"), table_name="lab_work")
    op.drop_index(op.f("ix_lab_work_patient_name"), table_name="lab_work")
    op.drop_index(op.f("ix_lab_work_id"), table_name="lab_work")
    op.drop_table("lab_work")
