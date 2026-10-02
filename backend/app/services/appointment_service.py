from sqlalchemy.orm import Session
from sqlalchemy import or_, case
from typing import Optional, List, Tuple
from datetime import date, time, datetime, timedelta, timezone
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.schemas.appointment import PublicAppointmentCreate, AppointmentCreate, AppointmentUpdate
from app.utils.exceptions import NotFoundError, AppointmentConflictError, ConflictError
from app.utils.validators import validate_appointment_datetime, clinic_open_time, clinic_close_time
import logging
import json

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = [AppointmentStatus.CONTACTED, AppointmentStatus.CONFIRMED]
DUPLICATE_WINDOW_MINUTES = 10
SLOT_STEP_MINUTES = 15


def check_appointment_conflict(
    db: Session,
    appointment_date: date,
    appointment_time: time,
    exclude_id: Optional[int] = None,
    for_update: bool = False,
) -> bool:
    """Check if an appointment slot is already taken by an active appointment."""
    query = db.query(Appointment).filter(
        Appointment.appointment_date == appointment_date,
        Appointment.appointment_time == appointment_time,
        Appointment.status.in_([s.value for s in ACTIVE_STATUSES]),
    )
    if exclude_id:
        query = query.filter(Appointment.id != exclude_id)
    if for_update:
        query = query.with_for_update()
    return query.first() is not None


def _generate_all_slots(on_date: date) -> List[time]:
    """Generate all 15-minute time slots within clinic hours for a given date.
    Returns an empty list if the date is a Sunday (clinic closed)."""
    if on_date.weekday() == 6:  # Sunday
        return []

    open_t = clinic_open_time()
    close_t = clinic_close_time()
    slots: List[time] = []
    h, m = open_t.hour, open_t.minute
    while True:
        t = time(h, m)
        if t >= close_t:
            break
        slots.append(t)
        m += SLOT_STEP_MINUTES
        if m >= 60:
            m -= 60
            h += 1
    return slots


def get_available_slots(
    db: Session,
    on_date: date,
    exclude_id: Optional[int] = None,
) -> List[str]:
    """
    Return a list of HH:MM time strings that are still available on the given date.
    A slot is unavailable when an ACTIVE (CONTACTED or CONFIRMED) appointment
    already occupies it. PENDING, COMPLETED, CANCELLED, and NO_SHOW do not block slots.
    """
    all_slots = _generate_all_slots(on_date)
    if not all_slots:
        return []

    # Fetch all booked times for ACTIVE appointments on this date
    query = db.query(Appointment.appointment_time).filter(
        Appointment.appointment_date == on_date,
        Appointment.appointment_time.isnot(None),
        Appointment.status.in_([s.value for s in ACTIVE_STATUSES]),
    )
    if exclude_id:
        query = query.filter(Appointment.id != exclude_id)

    # Normalise whatever the DB driver returns (datetime.time or timedelta) to HH:MM strings
    # so the comparison with generated slots is always type-safe.
    booked_strs: set = set()
    for row in query.all():
        t = row.appointment_time
        if t is None:
            continue
        if isinstance(t, time):
            booked_strs.add(f"{t.hour:02d}:{t.minute:02d}")
        elif isinstance(t, timedelta):
            # PyMySQL sometimes returns TIME columns as timedelta
            total_secs = int(t.total_seconds())
            h = total_secs // 3600
            m = (total_secs % 3600) // 60
            booked_strs.add(f"{h:02d}:{m:02d}")
        else:
            # Fallback: stringify and take HH:MM
            booked_strs.add(str(t)[:5])

    available = []
    for slot in all_slots:
        slot_str = f"{slot.hour:02d}:{slot.minute:02d}"
        if slot_str not in booked_strs:
            available.append(slot_str)
    return available


def create_public_appointment(db: Session, data: PublicAppointmentCreate) -> Appointment:
    """Create a public appointment request with PENDING status."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=DUPLICATE_WINDOW_MINUTES)
    duplicate = (
        db.query(Appointment)
        .filter(
            Appointment.contact_number == data.contact_number,
            Appointment.reason == data.reason,
            Appointment.status == AppointmentStatus.PENDING,
            Appointment.created_at >= cutoff,
        )
        .first()
    )
    if duplicate:
        raise ConflictError(
            "An identical appointment request was recently submitted. Please wait before submitting again."
        )

    appointment = Appointment(
        patient_name=data.patient_name,
        contact_number=data.contact_number,
        address=data.address,
        reason=data.reason,
        other_problem=data.other_problem,
        status=AppointmentStatus.PENDING,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    logger.info("Public appointment request created: id=%s", appointment.id)
    return appointment


def create_admin_appointment(db: Session, data: AppointmentCreate) -> Appointment:
    """Create an appointment from the admin panel with conflict and hours validation."""
    if data.appointment_date and data.appointment_time:
        validate_appointment_datetime(data.appointment_date, data.appointment_time)

        if data.status in ACTIVE_STATUSES:
            if check_appointment_conflict(
                db, data.appointment_date, data.appointment_time, for_update=True
            ):
                raise AppointmentConflictError()

    appointment = Appointment(
        client_id=data.client_id,
        patient_name=data.patient_name,
        contact_number=data.contact_number,
        address=data.address,
        reason=data.reason,
        other_problem=data.other_problem,
        status=data.status,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        notes=data.notes,
        total_amount=data.total_amount,
        amount_paid=data.amount_paid,
    )

    # Store multi-treatment list if provided
    if data.treatments:
        appointment.treatments = json.dumps(data.treatments)

    # Set last_payment_date when amount_paid is being recorded
    if data.amount_paid is not None:
        from app.timezone_utils import clinic_today
        appointment.last_payment_date = clinic_today()

    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    logger.info("Admin appointment created: id=%s", appointment.id)
    return appointment


def get_appointment_by_id(db: Session, appointment_id: int) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundError(f"Appointment not found.")
    return appointment


def _ensure_patient_record(db: Session, appointment: Appointment) -> None:
    """
    When an appointment is confirmed, ensure a patient (client) record exists.
    Deduplication rule: same name AND same contact_number = same patient.
    Same contact but different name = different patient (create new).
    """
    if appointment.client_id:
        return  # already linked to a patient record

    existing = (
        db.query(Client)
        .filter(
            Client.contact_number == appointment.contact_number,
            Client.name == appointment.patient_name,
        )
        .first()
    )
    if existing:
        appointment.client_id = existing.id
        logger.info(
            "Linked appointment id=%s to existing patient id=%s (%s)",
            appointment.id, existing.id, existing.name,
        )
    else:
        client = Client(
            name=appointment.patient_name,
            contact_number=appointment.contact_number,
            address=appointment.address,
        )
        db.add(client)
        db.flush()
        appointment.client_id = client.id
        logger.info(
            "Auto-created patient id=%s (%s) for appointment id=%s",
            client.id, client.name, appointment.id,
        )


def update_appointment(db: Session, appointment_id: int, data: AppointmentUpdate) -> Appointment:
    appointment = get_appointment_by_id(db, appointment_id)

    update_data = data.model_dump(exclude_unset=True)

    # Determine the final date and time for conflict checking
    new_date = update_data.get("appointment_date", appointment.appointment_date)
    new_time = update_data.get("appointment_time", appointment.appointment_time)
    new_status = update_data.get("status", appointment.status)

    if new_date and new_time:
        validate_appointment_datetime(new_date, new_time)

        if new_status in ACTIVE_STATUSES:
            if check_appointment_conflict(
                db, new_date, new_time, exclude_id=appointment_id, for_update=True
            ):
                raise AppointmentConflictError()

    # Handle treatments separately — encode list to JSON string
    treatments_list = update_data.pop("treatments", None)
    if treatments_list is not None:
        # Empty list [] clears treatments (falls back to single `reason`)
        appointment.treatments = json.dumps(treatments_list) if treatments_list else None

    # Track payment date: when amount_paid is set or changed, record today as last_payment_date
    if "amount_paid" in update_data:
        new_paid = update_data.get("amount_paid")
        if new_paid is not None:
            from app.timezone_utils import clinic_today
            appointment.last_payment_date = clinic_today()

    for field, value in update_data.items():
        setattr(appointment, field, value)

    # Auto-create patient record when appointment is confirmed.
    # Compare against the string value to handle both enum and raw string cases.
    if appointment.status in (AppointmentStatus.CONFIRMED, AppointmentStatus.CONFIRMED.value):
        _ensure_patient_record(db, appointment)

    db.commit()
    db.refresh(appointment)
    logger.info(f"Appointment updated: id={appointment_id}, status={appointment.status}")
    return appointment


def delete_appointment(db: Session, appointment_id: int) -> None:
    appointment = get_appointment_by_id(db, appointment_id)
    db.delete(appointment)
    db.commit()
    logger.info(f"Appointment deleted: id={appointment_id}")


def list_appointments(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    reason: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Tuple[List[Appointment], int]:
    query = db.query(Appointment)

    if status:
        query = query.filter(Appointment.status == status)
    if reason:
        query = query.filter(Appointment.reason == reason)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Appointment.patient_name.ilike(like),
                Appointment.contact_number.ilike(like),
            )
        )
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)

    total = query.count()
    appointments = (
        query.order_by(Appointment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return appointments, total


def get_calendar_appointments(
    db: Session,
    start_date: date,
    end_date: date,
) -> List[Appointment]:
    return (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
            Appointment.appointment_date.isnot(None),
        )
        .order_by(Appointment.appointment_date, Appointment.appointment_time)
        .all()
    )


def get_client_appointments(db: Session, client_id: int) -> List[Appointment]:
    # MySQL doesn't support NULLS LAST syntax, so use a CASE to push NULLs to the end
    date_is_null = case((Appointment.appointment_date.is_(None), 1), else_=0)
    return (
        db.query(Appointment)
        .filter(Appointment.client_id == client_id)
        .order_by(date_is_null, Appointment.appointment_date.desc(), Appointment.created_at.desc())
        .all()
    )
