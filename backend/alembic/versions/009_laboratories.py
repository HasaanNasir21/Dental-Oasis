"""Add laboratories table and link lab_work to laboratory

Revision ID: 009_laboratories
Revises: 008_lab_work_types
Create Date: 2026-11-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009_laboratories"
down_revision: Union[str, None] = "008_lab_work_types"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create laboratories table
    op.create_table(
        "laboratories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_laboratories_name"),
    )
    op.create_index(op.f("ix_laboratories_id"), "laboratories", ["id"], unique=False)
    op.create_index(op.f("ix_laboratories_name"), "laboratories", ["name"], unique=True)
    op.create_index(op.f("ix_laboratories_is_active"), "laboratories", ["is_active"], unique=False)

    # 2. Add laboratory_id FK column to lab_work
    op.add_column(
        "lab_work",
        sa.Column("laboratory_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_lab_work_laboratory",
        "lab_work",
        "laboratories",
        ["laboratory_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_lab_work_laboratory_id"), "lab_work", ["laboratory_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lab_work_laboratory_id"), table_name="lab_work")
    op.drop_constraint("fk_lab_work_laboratory", "lab_work", type_="foreignkey")
    op.drop_column("lab_work", "laboratory_id")

    op.drop_index(op.f("ix_laboratories_is_active"), table_name="laboratories")
    op.drop_index(op.f("ix_laboratories_name"), table_name="laboratories")
    op.drop_index(op.f("ix_laboratories_id"), table_name="laboratories")
    op.drop_table("laboratories")
