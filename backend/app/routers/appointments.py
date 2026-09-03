from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut, AppointmentList
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import appointment_service
import math

router = APIRouter(prefix="/api/admin/appointments", tags=["Admin - Appointments"])


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
