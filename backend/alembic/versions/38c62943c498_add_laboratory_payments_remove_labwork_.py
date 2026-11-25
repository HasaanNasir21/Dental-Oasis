"""add_laboratory_payments_remove_labwork_payment_fields

Revision ID: 38c62943c498
Revises: 012_lab_work_payment
Create Date: 2026-11-25 23:22:28.320283

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '38c62943c498'
down_revision: Union[str, None] = '012_lab_work_payment'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create laboratory_payments table
    op.create_table(
        'laboratory_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('laboratory_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['laboratory_id'], ['laboratories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_laboratory_payments_id', 'laboratory_payments', ['id'])
    op.create_index('ix_laboratory_payments_laboratory_id', 'laboratory_payments', ['laboratory_id'])
    op.create_index('ix_laboratory_payments_payment_date', 'laboratory_payments', ['payment_date'])
    op.create_index('ix_lab_payment_date', 'laboratory_payments', ['laboratory_id', 'payment_date'])

    # Remove cost and amount_paid columns from lab_work table
    with op.batch_alter_table('lab_work', schema=None) as batch_op:
        batch_op.drop_column('cost')
        batch_op.drop_column('amount_paid')


def downgrade() -> None:
    # Add back cost and amount_paid columns to lab_work
    with op.batch_alter_table('lab_work', schema=None) as batch_op:
        batch_op.add_column(sa.Column('amount_paid', sa.Numeric(precision=10, scale=2), nullable=True))
        batch_op.add_column(sa.Column('cost', sa.Numeric(precision=10, scale=2), nullable=True))

    # Drop laboratory_payments table
    op.drop_index('ix_lab_payment_date', table_name='laboratory_payments')
    op.drop_index('ix_laboratory_payments_payment_date', table_name='laboratory_payments')
    op.drop_index('ix_laboratory_payments_laboratory_id', table_name='laboratory_payments')
    op.drop_index('ix_laboratory_payments_id', table_name='laboratory_payments')
    op.drop_table('laboratory_payments')

