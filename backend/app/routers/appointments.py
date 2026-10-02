from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut, AppointmentList
from app.schemas.appointment_file import AppointmentFileOut
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import appointment_service
from app.services import appointment_file_service
import math

router = APIRouter(prefix="/api/admin/appointments", tags=["Admin - Appointments"])


@router.get("/available-slots", response_model=SuccessResponse[List[str]])
def get_available_slots(
    date: date = Query(..., description="Date to check availability for (YYYY-MM-DD)"),
    exclude_id: Optional[int] = Query(default=None, description="Appointment ID to exclude (for editing an existing appointment)"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """
    Return a list of available HH:MM time slots for the given date.
    Slots occupied by CONTACTED or CONFIRMED appointments are excluded.
    Returns an empty list for Sundays (clinic closed).
    """
    slots = appointment_service.get_available_slots(db, date, exclude_id=exclude_id)
    return SuccessResponse(success=True, message="OK", data=slots)


@router.get("", response_model=PaginatedResponse[AppointmentList])
def list_appointments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    reason: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=100),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    appointments, total = appointment_service.list_appointments(
        db, page, page_size, status, reason, search, date_from, date_to
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=appointments,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=SuccessResponse[AppointmentOut])
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    appointment = appointment_service.create_admin_appointment(db, data)
    return SuccessResponse(success=True, message="Appointment created successfully.", data=appointment)


@router.get("/{appointment_id}", response_model=SuccessResponse[AppointmentOut])
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    appointment = appointment_service.get_appointment_by_id(db, appointment_id)
    return SuccessResponse(success=True, message="OK", data=appointment)


@router.patch("/{appointment_id}", response_model=SuccessResponse[AppointmentOut])
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    appointment = appointment_service.update_appointment(db, appointment_id, data)
    return SuccessResponse(success=True, message="Appointment updated successfully.", data=appointment)


@router.delete("/{appointment_id}", response_model=SuccessResponse)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    appointment_service.delete_appointment(db, appointment_id)
    return SuccessResponse(success=True, message="Appointment deleted successfully.")


# ── File upload / management ──────────────────────────────────────────────────

@router.get("/{appointment_id}/files", response_model=SuccessResponse[List[AppointmentFileOut]])
def list_files(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    files = appointment_file_service.list_appointment_files(db, appointment_id)
    return SuccessResponse(success=True, message="OK", data=files)


@router.post("/{appointment_id}/files", response_model=SuccessResponse[AppointmentFileOut])
def upload_file(
    appointment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    record = appointment_file_service.upload_appointment_file(db, appointment_id, file)
    return SuccessResponse(success=True, message="File uploaded successfully.", data=record)


@router.delete("/{appointment_id}/files/{file_id}", response_model=SuccessResponse)
def delete_file(
    appointment_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    appointment_file_service.delete_appointment_file(db, appointment_id, file_id)
    return SuccessResponse(success=True, message="File deleted successfully.")
