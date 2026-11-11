"""Add employees and employee_payments tables

Revision ID: 006_employee_payments
Revises: 005_treatments_payment_date
Create Date: 2026-11-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006_employee_payments"
down_revision: Union[str, None] = "005_treatments_payment_date"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- employees ---
    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("contact_number", sa.String(length=20), nullable=True),
        sa.Column("role", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_employees_id"), "employees", ["id"], unique=False)
    op.create_index(op.f("ix_employees_name"), "employees", ["name"], unique=False)

    # --- employee_payments ---
    op.create_table(
        "employee_payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_employee_payments_id"), "employee_payments", ["id"], unique=False)
    op.create_index(op.f("ix_employee_payments_employee_id"), "employee_payments", ["employee_id"], unique=False)
    op.create_index(op.f("ix_employee_payments_payment_date"), "employee_payments", ["payment_date"], unique=False)
    op.create_index("ix_employee_payments_emp_date", "employee_payments", ["employee_id", "payment_date"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_employee_payments_emp_date", table_name="employee_payments")
    op.drop_index(op.f("ix_employee_payments_payment_date"), table_name="employee_payments")
    op.drop_index(op.f("ix_employee_payments_employee_id"), table_name="employee_payments")
    op.drop_index(op.f("ix_employee_payments_id"), table_name="employee_payments")
    op.drop_table("employee_payments")

    op.drop_index(op.f("ix_employees_name"), table_name="employees")
    op.drop_index(op.f("ix_employees_id"), table_name="employees")
    op.drop_table("employees")
