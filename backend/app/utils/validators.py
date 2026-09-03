from datetime import date, time
from app.utils.exceptions import SundayAppointmentError, OutsideClinicHoursError
from app.config import settings


def _parse_hhmm(value: str) -> time:
    parts = value.strip().split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    return time(hour, minute)


def clinic_open_time() -> time:
    return _parse_hhmm(settings.CLINIC_OPEN_TIME)


def clinic_close_time() -> time:
    return _parse_hhmm(settings.CLINIC_CLOSE_TIME)


def validate_appointment_date(appointment_date: date) -> None:
    """Validate that the appointment date is not a Sunday (clinic closed)."""
    if appointment_date.weekday() == 6:
        raise SundayAppointmentError()


def validate_appointment_time(appointment_time: time) -> None:
    """Validate that the appointment time is within clinic hours."""
    open_t = clinic_open_time()
    close_t = clinic_close_time()
    if not (open_t <= appointment_time < close_t):
        raise OutsideClinicHoursError(
            "Selected time is outside clinic hours. Clinic is open Monday-Saturday, 5:00 PM - 9:00 PM."
        )


def validate_appointment_datetime(appointment_date: date, appointment_time: time) -> None:
    validate_appointment_date(appointment_date)
    validate_appointment_time(appointment_time)
