import enum
from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="appointments")

    __table_args__ = (
        Index("ix_appointments_date_time", "appointment_date", "appointment_time"),
    )
