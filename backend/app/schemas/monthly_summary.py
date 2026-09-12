from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class MonthlyPaymentSummaryOut(BaseModel):
    """A single patient's payment summary for one calendar month."""
    id: int
    year: int
    month: int
    client_id: Optional[int] = None
    patient_name: str
    total_charged: Decimal
    total_paid: Decimal
    total_pending: Decimal
    appointment_count: int
    snapshot_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class ClinicMonthlyTotals(BaseModel):
    """Clinic-wide aggregate for a single calendar month (sum across all patients)."""
    year: int
    month: int
    month_label: str          # e.g. "August 2026"
    total_charged: Decimal
    total_paid: Decimal
    total_pending: Decimal
    patient_count: int        # how many distinct patients had appointments
    appointment_count: int    # total appointments in the period


class CurrentMonthPayments(BaseModel):
    """Live (current month, not yet archived) payment snapshot."""
    year: int
    month: int
    month_label: str
    total_charged: Decimal
    total_paid: Decimal
    total_pending: Decimal
    patient_count: int
    appointment_count: int


class MonthlyRolloverResult(BaseModel):
    """Returned by the manual-rollover endpoint."""
    year: int
    month: int
    month_label: str
    patients_archived: int
    message: str


class MonthlyHistoryResponse(BaseModel):
    """Full response for the monthly history list endpoint."""
    current_month: CurrentMonthPayments
    archived_months: List[ClinicMonthlyTotals]
