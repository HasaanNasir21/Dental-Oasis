import enum
import json
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LabWorkType(str, enum.Enum):
    PFM = "PFM"
    PFM_3D = "3D PFM"
    ZIRCONIA = "Zirconia"
    EMAX = "E-Max"
    DENTURES = "Dentures"
    ALIGNER = "Aligner"
    INLAY = "Inlay"
    CC_PLATE = "CC Plate"
    OTHER = "Other"


class LabWorkStatus(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class LabWork(Base):
    __tablename__ = "lab_work"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(255), nullable=False, index=True)
    client_id = Column(
        Integer,
        ForeignKey("clients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    work_type = Column(
        SAEnum(LabWorkType, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=LabWorkType.PFM,
        index=True,
    )
    teeth = Column(Text, nullable=True)  # JSON array of FDI tooth numbers, e.g. ["16","17","26","27"]
    status = Column(
        SAEnum(LabWorkStatus, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=LabWorkStatus.PENDING,
        index=True,
    )
    laboratory_id = Column(
        Integer,
        ForeignKey("laboratories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    work_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Optional link to a patient record
    client = relationship("Client")
    # Optional link to a laboratory
    laboratory = relationship("Laboratory", back_populates="lab_works")

    def get_teeth(self) -> list:
        """Return selected teeth as a list of FDI number strings."""
        if self.teeth:
            try:
                return json.loads(self.teeth)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_teeth(self, teeth: list) -> None:
        """Store a list of FDI tooth numbers as a JSON string."""
        self.teeth = json.dumps(sorted(teeth)) if teeth else None

    __table_args__ = (
        Index("ix_lab_work_date_type", "work_date", "work_type"),
    )
