from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, extract
from datetime import timedelta
from decimal import Decimal
from typing import Dict, Any
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.timezone_utils import clinic_today
from app.schemas.appointment import AppointmentOut
from app.services.monthly_payment_service import (
    get_current_month_payments,
    get_archived_monthly_totals,
    BILLABLE_STATUSES,
)


def _serialize_appointment(a: Appointment) -> dict:
    return AppointmentOut.model_validate(a).model_dump(mode="json")


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    today = clinic_today()

    total_clients = db.query(func.count(Client.id)).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0

    # All-time totals (sum across every appointment ever)
    all_time_charged = float(
        db.query(func.coalesce(func.sum(Appointment.total_amount), 0)).scalar() or 0
    )
    all_time_paid = float(
        db.query(func.coalesce(func.sum(Appointment.amount_paid), 0)).scalar() or 0
    )
    all_time_pending = max(all_time_charged - all_time_paid, 0.0)

    def count_by_status(status: AppointmentStatus) -> int:
        return db.query(func.count(Appointment.id)).filter(
            Appointment.status == status.value
        ).scalar() or 0

    pending = count_by_status(AppointmentStatus.PENDING)
    contacted = count_by_status(AppointmentStatus.CONTACTED)
    confirmed = count_by_status(AppointmentStatus.CONFIRMED)
    completed = count_by_status(AppointmentStatus.COMPLETED)
    cancelled = count_by_status(AppointmentStatus.CANCELLED)
    no_show = count_by_status(AppointmentStatus.NO_SHOW)

    today_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date == today,
            Appointment.status == AppointmentStatus.CONFIRMED.value,
        )
        .order_by(Appointment.appointment_time)
        .all()
    )

    upcoming_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date > today,
            Appointment.status == AppointmentStatus.CONFIRMED.value,
        )
        .order_by(Appointment.appointment_date, Appointment.appointment_time)
        .limit(10)
        .all()
    )

    # Chart: appointments by status
    status_chart = [
        {"status": "Pending", "count": pending},
        {"status": "Contacted", "count": contacted},
        {"status": "Confirmed", "count": confirmed},
        {"status": "Completed", "count": completed},
        {"status": "Cancelled", "count": cancelled},
        {"status": "No Show", "count": no_show},
    ]

    # Chart: appointments over last 7 days
    trend_chart = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = db.query(func.count(Appointment.id)).filter(
            cast(Appointment.created_at, Date) == d
        ).scalar() or 0
        trend_chart.append({"date": d.strftime("%b %d"), "count": count})

    # Current month payment snapshot (live, not yet archived)
    current_month = get_current_month_payments(db)

    # Last 12 archived months clinic-wide totals
    archived_months = get_archived_monthly_totals(db, limit=12)
    archived_months_data = [
        {
            "year": m.year,
            "month": m.month,
            "month_label": m.month_label,
            "total_charged": float(m.total_charged),
            "total_paid": float(m.total_paid),
            "total_pending": float(m.total_pending),
            "patient_count": m.patient_count,
            "appointment_count": m.appointment_count,
        }
        for m in archived_months
    ]

    return {
        "total_clients": total_clients,
        "total_appointments": total_appointments,
        # All-time totals (kept for backward compat, now split into 3 fields)
        "total_payments": all_time_paid,
        "all_time_charged": all_time_charged,
        "all_time_paid": all_time_paid,
        "all_time_pending": all_time_pending,
        # Current month (live)
        "current_month_year": current_month.year,
        "current_month_month": current_month.month,
        "current_month_label": current_month.month_label,
        "current_month_charged": float(current_month.total_charged),
        "current_month_paid": float(current_month.total_paid),
        "current_month_pending": float(current_month.total_pending),
        "current_month_patients": current_month.patient_count,
        "current_month_appointments": current_month.appointment_count,
        # Appointment status counts
        "pending_appointments": pending,
        "contacted_appointments": contacted,
        "confirmed_appointments": confirmed,
        "completed_appointments": completed,
        "cancelled_appointments": cancelled,
        "no_show_appointments": no_show,
        # Today / upcoming
        "today_appointments": [_serialize_appointment(a) for a in today_appointments],
        "upcoming_appointments": [_serialize_appointment(a) for a in upcoming_appointments],
        # Charts
        "status_chart": status_chart,
        "trend_chart": trend_chart,
        # Archived monthly history
        "archived_months": archived_months_data,
    }
