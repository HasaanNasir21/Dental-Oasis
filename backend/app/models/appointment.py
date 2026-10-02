import enum
from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, Numeric, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import json


class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONTACTED = "CONTACTED"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class AppointmentReason(str, enum.Enum):
    CHECKUP = "Checkup"
    IMPLANT = "Implant"
    BRACES = "Braces"
    INVISIBLE_ALIGNERS = "Invisible Aligners"
    ROOT_CANAL = "Root Canal Treatment"
    REMOVABLE_DENTURE = "Removable Denture"
    CAST_PARTIAL_DENTURE = "Cast Partial Denture"
    EMAX = "E-Max"
    ZIRCONIA = "Zirconia"
    PFM = "PFM"
    VENEERS = "Veneers"
    TOOTH_EXTRACTION = "Tooth Extraction"
    SCALING_POLISHING = "Scaling & Polishing"
    FILLING = "Filling"
    OTHER = "Other"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_name = Column(String(255), nullable=False, index=True)
    contact_number = Column(String(20), nullable=False, index=True)
    address = Column(Text, nullable=True)
    reason = Column(String(100), nullable=False)
    other_problem = Column(Text, nullable=True)
    status = Column(
        SAEnum(AppointmentStatus, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=AppointmentStatus.PENDING,
        index=True,
    )
    appointment_date = Column(Date, nullable=True, index=True)
    appointment_time = Column(Time, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    # Comma-separated or JSON-encoded list of treatment names for multi-treatment support.
    # Stored as JSON array text. When populated, takes precedence over `reason` for display.
    treatments = Column(Text, nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=True)
    amount_paid = Column(Numeric(10, 2), nullable=True)
    # Date when a payment (amount_paid) was last recorded. Used for monthly revenue bucketing
    # so revenue is attributed to the month the payment was entered, not the appointment date.
    last_payment_date = Column(Date, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def get_treatments(self) -> list:
        """Return treatments as a Python list. Falls back to [reason] if not set."""
        if self.treatments:
            try:
                return json.loads(self.treatments)
            except (json.JSONDecodeError, TypeError):
                return [self.treatments]
        return [self.reason] if self.reason else []

    def set_treatments(self, treatments: list) -> None:
        """Store a list of treatment names as a JSON string."""
        self.treatments = json.dumps(treatments) if treatments else None

    # Relationships
    client = relationship("Client", back_populates="appointments")
    files = relationship(
        "AppointmentFile",
        back_populates="appointment",
        cascade="all, delete-orphan",
        order_by="AppointmentFile.uploaded_at",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_appointments_date_time", "appointment_date", "appointment_time"),
    )
