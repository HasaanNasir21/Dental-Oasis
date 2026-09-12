from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MonthlyPaymentSummary(Base):
    """
    Archived monthly payment totals per patient.

    At midnight on the 1st of each month the scheduler snapshots the previous
    month's appointment payments (total charged, total paid, total pending) for
    every patient that had at least one appointment in that period, then inserts
    rows here so the new month starts fresh.
    """

    __tablename__ = "monthly_payment_summaries"

    id = Column(Integer, primary_key=True, index=True)

    # Period this row covers (e.g. year=2026, month=8 → August 2026)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)

    # Patient link — nullable because a client record might be deleted later
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_name = Column(String(255), nullable=False)

    # Aggregated payment figures for the period
    total_charged = Column(Numeric(10, 2), nullable=False, default=0)
    total_paid = Column(Numeric(10, 2), nullable=False, default=0)
    total_pending = Column(Numeric(10, 2), nullable=False, default=0)

    # How many appointments contributed to these totals
    appointment_count = Column(Integer, nullable=False, default=0)

    # The date this snapshot was created (will be the 1st of the following month)
    snapshot_date = Column(Date, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="monthly_summaries")

    __table_args__ = (
        Index("ix_monthly_payment_summaries_year_month", "year", "month"),
        Index("ix_monthly_payment_summaries_unique_client_period", "client_id", "year", "month"),
    )
