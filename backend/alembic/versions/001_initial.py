"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("contact_number", sa.String(length=20), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_clients_id"), "clients", ["id"], unique=False)
    op.create_index(op.f("ix_clients_name"), "clients", ["name"], unique=False)
    op.create_index(op.f("ix_clients_contact_number"), "clients", ["contact_number"], unique=False)

    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("short_description", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_services_id"), "services", ["id"], unique=False)
    op.create_index(op.f("ix_services_slug"), "services", ["slug"], unique=True)

    op.create_table(
        "testimonials",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_testimonials_id"), "testimonials", ["id"], unique=False)

    op.create_table(
        "clinic_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("whatsapp", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("google_maps_url", sa.String(length=500), nullable=True),
        sa.Column("hours_monday_saturday", sa.String(length=100), nullable=False, server_default="5:00 PM - 9:00 PM"),
        sa.Column("hours_sunday", sa.String(length=100), nullable=False, server_default="Closed"),
        sa.Column("social_facebook", sa.String(length=500), nullable=True),
        sa.Column("social_instagram", sa.String(length=500), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column("patient_name", sa.String(length=255), nullable=False),
        sa.Column("contact_number", sa.String(length=20), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("reason", sa.String(length=100), nullable=False),
        sa.Column("other_problem", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING",
                "CONTACTED",
                "CONFIRMED",
                "COMPLETED",
                "CANCELLED",
                "NO_SHOW",
                name="appointmentstatus",
            ),
            nullable=False,
        ),
        sa.Column("appointment_date", sa.Date(), nullable=True),
        sa.Column("appointment_time", sa.Time(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_appointments_id"), "appointments", ["id"], unique=False)
    op.create_index(op.f("ix_appointments_client_id"), "appointments", ["client_id"], unique=False)
    op.create_index(op.f("ix_appointments_patient_name"), "appointments", ["patient_name"], unique=False)
    op.create_index(op.f("ix_appointments_contact_number"), "appointments", ["contact_number"], unique=False)
    op.create_index(op.f("ix_appointments_status"), "appointments", ["status"], unique=False)
    op.create_index(op.f("ix_appointments_appointment_date"), "appointments", ["appointment_date"], unique=False)
    op.create_index(op.f("ix_appointments_appointment_time"), "appointments", ["appointment_time"], unique=False)
    op.create_index("ix_appointments_date_time", "appointments", ["appointment_date", "appointment_time"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_appointments_date_time", table_name="appointments")
    op.drop_index(op.f("ix_appointments_appointment_time"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_appointment_date"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_status"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_contact_number"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_patient_name"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_client_id"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_id"), table_name="appointments")
    op.drop_table("appointments")
    op.drop_table("clinic_settings")
    op.drop_index(op.f("ix_testimonials_id"), table_name="testimonials")
    op.drop_table("testimonials")
    op.drop_index(op.f("ix_services_slug"), table_name="services")
    op.drop_index(op.f("ix_services_id"), table_name="services")
    op.drop_table("services")
    op.drop_index(op.f("ix_clients_contact_number"), table_name="clients")
    op.drop_index(op.f("ix_clients_name"), table_name="clients")
    op.drop_index(op.f("ix_clients_id"), table_name="clients")
    op.drop_table("clients")
