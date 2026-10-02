from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AppointmentFile(Base):
    __tablename__ = "appointment_files"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(
        Integer,
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Cloudinary public_id — needed to delete the file from Cloudinary
    cloudinary_public_id = Column(String(512), nullable=False)
    # Full secure URL returned by Cloudinary
    file_url = Column(Text, nullable=False)
    # "image" or "pdf"
    file_type = Column(String(10), nullable=False)
    # Original filename as uploaded by the user
    file_name = Column(String(255), nullable=False)
    uploaded_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship back to appointment
    appointment = relationship("Appointment", back_populates="files")
