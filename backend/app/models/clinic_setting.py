from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ClinicSetting(Base):
    """Single-row table for editable, non-sensitive clinic information."""

    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    google_maps_url = Column(String(500), nullable=True)
    hours_monday_saturday = Column(String(100), nullable=False, default="5:00 PM - 9:00 PM")
    hours_sunday = Column(String(100), nullable=False, default="Closed")
    social_facebook = Column(String(500), nullable=True)
    social_instagram = Column(String(500), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
