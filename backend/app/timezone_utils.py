"""Clinic local timezone helpers.

Dental Oasis operates in Lahore, Pakistan (Asia/Karachi, UTC+05:00).
Appointment dates and "today" are evaluated in this timezone, not the server UTC date.
"""

from datetime import date, datetime, time
from zoneinfo import ZoneInfo
from app.config import settings

CLINIC_TZ = ZoneInfo(settings.CLINIC_TIMEZONE)


def clinic_now() -> datetime:
    return datetime.now(CLINIC_TZ)


def clinic_today() -> date:
    return clinic_now().date()


def combine_clinic_datetime(d: date, t: time) -> datetime:
    return datetime.combine(d, t, tzinfo=CLINIC_TZ)
