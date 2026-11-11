"""Extend lab_work work_type enum with 3D PFM, Aligner, Inlay, CC Plate

Revision ID: 008_lab_work_types
Revises: 007_lab_work
Create Date: 2026-11-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "008_lab_work_types"
down_revision: Union[str, None] = "007_lab_work"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # MySQL requires ALTER TABLE to modify an ENUM column.
    # We list all values including the new ones.
    op.execute(
        "ALTER TABLE lab_work MODIFY COLUMN work_type "
        "ENUM('PFM','3D PFM','Zirconia','E-Max','Dentures','Aligner','Inlay','CC Plate','Other') NOT NULL"
    )


def downgrade() -> None:
    # Remove the new values — any rows with the new types will be lost.
    op.execute(
        "ALTER TABLE lab_work MODIFY COLUMN work_type "
        "ENUM('PFM','Zirconia','E-Max','Dentures','Other') NOT NULL"
    )
