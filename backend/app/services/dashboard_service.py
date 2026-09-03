from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import timedelta
from typing import Dict, Any
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.timezone_utils import clinic_today
from app.schemas.appointment import AppointmentOut


def _serialize_appointment(a: Appointment) -> dict:
    return AppointmentOut.model_validate(a).model_dump(mode="json")


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    today = clinic_today()

    total_clients = db.query(func.count(Client.id)).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0

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

    return {
        "total_clients": total_clients,
        "total_appointments": total_appointments,
        "pending_appointments": pending,
        "contacted_appointments": contacted,
        "confirmed_appointments": confirmed,
        "completed_appointments": completed,
        "cancelled_appointments": cancelled,
        "no_show_appointments": no_show,
        "today_appointments": [_serialize_appointment(a) for a in today_appointments],
        "upcoming_appointments": [_serialize_appointment(a) for a in upcoming_appointments],
        "status_chart": status_chart,
        "trend_chart": trend_chart,
    }
