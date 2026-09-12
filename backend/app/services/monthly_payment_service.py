"""
Monthly payment service.

Responsibilities:
  - Aggregate current-month live payment data from appointments
  - Archive previous month's data into monthly_payment_summaries
  - Provide clinic-wide and per-patient monthly history
  - Called by the APScheduler job on the 1st of each month at midnight (clinic TZ)
"""

import logging
import calendar
from datetime import date
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.models.monthly_payment_summary import MonthlyPaymentSummary
from app.schemas.monthly_summary import (
    ClinicMonthlyTotals,
    CurrentMonthPayments,
    MonthlyHistoryResponse,
    MonthlyRolloverResult,
)
from app.timezone_utils import clinic_today

logger = logging.getLogger(__name__)

# Statuses that count toward payment totals.
# Only appointments that are CONFIRMED or COMPLETED are billable —
# PENDING, CONTACTED, CANCELLED, and NO_SHOW are excluded entirely.
BILLABLE_STATUSES = [
    AppointmentStatus.CONFIRMED.value,
    AppointmentStatus.COMPLETED.value,
]


def _month_label(year: int, month: int) -> str:
    """Return a human-readable month label, e.g. 'August 2026'."""
    return f"{calendar.month_name[month]} {year}"


def _previous_month(year: int, month: int):
    """Return (year, month) of the month before the given one."""
    if month == 1:
        return year - 1, 12
    return year, month - 1


# ---------------------------------------------------------------------------
# Live current-month aggregation (not yet archived)
# ---------------------------------------------------------------------------

def get_current_month_payments(db: Session) -> CurrentMonthPayments:
    """
    Aggregate payment data for appointments in the current calendar month
    (clinic timezone). Only billable statuses are counted.
    """
    today = clinic_today()
    year, month = today.year, today.month

    rows = (
        db.query(
            func.coalesce(func.sum(Appointment.total_amount), 0).label("total_charged"),
            func.coalesce(func.sum(Appointment.amount_paid), 0).label("total_paid"),
            func.count(Appointment.id.distinct()).label("appointment_count"),
        )
        .filter(
            extract("year", Appointment.appointment_date) == year,
            extract("month", Appointment.appointment_date) == month,
            Appointment.status.in_(BILLABLE_STATUSES),
        )
        .one()
    )

    patient_count = (
        db.query(func.count(func.distinct(Appointment.patient_name)))
        .filter(
            extract("year", Appointment.appointment_date) == year,
            extract("month", Appointment.appointment_date) == month,
            Appointment.status.in_(BILLABLE_STATUSES),
        )
        .scalar()
        or 0
    )

    total_charged = Decimal(str(rows.total_charged))
    total_paid = Decimal(str(rows.total_paid))
    total_pending = max(total_charged - total_paid, Decimal("0"))

    return CurrentMonthPayments(
        year=year,
        month=month,
        month_label=_month_label(year, month),
        total_charged=total_charged,
        total_paid=total_paid,
        total_pending=total_pending,
        patient_count=int(patient_count),
        appointment_count=int(rows.appointment_count),
    )


# ---------------------------------------------------------------------------
# Archived monthly history
# ---------------------------------------------------------------------------

def get_archived_monthly_totals(
    db: Session,
    limit: int = 12,
) -> List[ClinicMonthlyTotals]:
    """
    Return clinic-wide totals for the last `limit` archived months,
    newest first.
    """
    rows = (
        db.query(
            MonthlyPaymentSummary.year,
            MonthlyPaymentSummary.month,
            func.coalesce(func.sum(MonthlyPaymentSummary.total_charged), 0).label("total_charged"),
            func.coalesce(func.sum(MonthlyPaymentSummary.total_paid), 0).label("total_paid"),
            func.coalesce(func.sum(MonthlyPaymentSummary.total_pending), 0).label("total_pending"),
            func.count(MonthlyPaymentSummary.id).label("patient_count"),
            func.sum(MonthlyPaymentSummary.appointment_count).label("appointment_count"),
        )
        .group_by(MonthlyPaymentSummary.year, MonthlyPaymentSummary.month)
        .order_by(MonthlyPaymentSummary.year.desc(), MonthlyPaymentSummary.month.desc())
        .limit(limit)
        .all()
    )

    return [
        ClinicMonthlyTotals(
            year=r.year,
            month=r.month,
            month_label=_month_label(r.year, r.month),
            total_charged=Decimal(str(r.total_charged)),
            total_paid=Decimal(str(r.total_paid)),
            total_pending=Decimal(str(r.total_pending)),
            patient_count=int(r.patient_count),
            appointment_count=int(r.appointment_count or 0),
        )
        for r in rows
    ]


def get_monthly_history(db: Session) -> MonthlyHistoryResponse:
    """Combined response: live current month + last 12 archived months."""
    return MonthlyHistoryResponse(
        current_month=get_current_month_payments(db),
        archived_months=get_archived_monthly_totals(db, limit=12),
    )


def get_patient_monthly_summaries(
    db: Session,
    client_id: int,
    limit: int = 12,
) -> List[MonthlyPaymentSummary]:
    """Return archived monthly summaries for a specific patient, newest first."""
    return (
        db.query(MonthlyPaymentSummary)
        .filter(MonthlyPaymentSummary.client_id == client_id)
        .order_by(MonthlyPaymentSummary.year.desc(), MonthlyPaymentSummary.month.desc())
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# Rollover (archival) logic
# ---------------------------------------------------------------------------

def _archive_month(db: Session, year: int, month: int, snapshot_date: date) -> int:
    """
    Aggregate appointment payments for the given year/month and insert
    MonthlyPaymentSummary rows (one per patient). Returns number of patients
    archived. Idempotent — existing rows for the same period are deleted first.
    """
    # Remove any previous snapshot for this period (allows re-running safely)
    db.query(MonthlyPaymentSummary).filter(
        MonthlyPaymentSummary.year == year,
        MonthlyPaymentSummary.month == month,
    ).delete(synchronize_session=False)

    # Aggregate per patient (group by client_id + patient_name to handle
    # the case where client_id is NULL but we still know the patient name)
    rows = (
        db.query(
            Appointment.client_id,
            Appointment.patient_name,
            func.coalesce(func.sum(Appointment.total_amount), 0).label("total_charged"),
            func.coalesce(func.sum(Appointment.amount_paid), 0).label("total_paid"),
            func.count(Appointment.id).label("appointment_count"),
        )
        .filter(
            extract("year", Appointment.appointment_date) == year,
            extract("month", Appointment.appointment_date) == month,
            Appointment.status.in_(BILLABLE_STATUSES),
        )
        .group_by(Appointment.client_id, Appointment.patient_name)
        .all()
    )

    if not rows:
        logger.info("No billable appointments found for %s/%s — nothing archived.", year, month)
        return 0

    summaries = []
    for r in rows:
        total_charged = Decimal(str(r.total_charged))
        total_paid = Decimal(str(r.total_paid))
        total_pending = max(total_charged - total_paid, Decimal("0"))

        summaries.append(
            MonthlyPaymentSummary(
                year=year,
                month=month,
                client_id=r.client_id,
                patient_name=r.patient_name,
                total_charged=total_charged,
                total_paid=total_paid,
                total_pending=total_pending,
                appointment_count=int(r.appointment_count),
                snapshot_date=snapshot_date,
            )
        )

    db.bulk_save_objects(summaries)
    db.commit()
    logger.info(
        "Monthly rollover complete: archived %d patient records for %s/%s",
        len(summaries), year, month,
    )
    return len(summaries)


def run_monthly_rollover(db: Session, target_year: Optional[int] = None, target_month: Optional[int] = None) -> MonthlyRolloverResult:
    """
    Archive the previous calendar month's payment data.

    If target_year / target_month are provided they override the auto-calculated
    previous month (useful for manual backfills from the admin endpoint).
    """
    today = clinic_today()

    if target_year is not None and target_month is not None:
        year, month = target_year, target_month
    else:
        year, month = _previous_month(today.year, today.month)

    patients_archived = _archive_month(db, year, month, snapshot_date=today)

    return MonthlyRolloverResult(
        year=year,
        month=month,
        month_label=_month_label(year, month),
        patients_archived=patients_archived,
        message=(
            f"Successfully archived {patients_archived} patient record(s) "
            f"for {_month_label(year, month)}."
        ),
    )
