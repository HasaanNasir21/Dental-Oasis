from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LaboratoryPayment(Base):
    """
    Track payments made to a laboratory on specific dates.
    Each payment is linked to a laboratory and has a payment date.
    Payments are grouped by month automatically via queries.
    """
    __tablename__ = "laboratory_payments"

    id = Column(Integer, primary_key=True, index=True)
    laboratory_id = Column(
        Integer,
        ForeignKey("laboratories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    payment_date = Column(Date, nullable=False, index=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to laboratory
    laboratory = relationship("Laboratory", back_populates="payments")

    __table_args__ = (
        Index("ix_lab_payment_date", "laboratory_id", "payment_date"),
    )
