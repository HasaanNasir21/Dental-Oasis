from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut, ClientList
from app.schemas.appointment import AppointmentCreate, AppointmentOut
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import client_service, appointment_service
import math

router = APIRouter(prefix="/api/admin/clients", tags=["Admin - Clients"])


@router.get("", response_model=PaginatedResponse[ClientList])
def list_clients(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    clients, total = client_service.list_clients(db, page, page_size, search)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=clients,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=SuccessResponse[ClientOut], status_code=201)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    client = client_service.create_client(db, data)
    return SuccessResponse(success=True, message="Client created successfully.", data=client)


@router.get("/{client_id}", response_model=SuccessResponse[ClientOut])
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    client = client_service.get_client_by_id(db, client_id)
    return SuccessResponse(success=True, message="OK", data=client)


@router.patch("/{client_id}", response_model=SuccessResponse[ClientOut])
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    client = client_service.update_client(db, client_id, data)
    return SuccessResponse(success=True, message="Client updated successfully.", data=client)


@router.delete("/{client_id}", response_model=SuccessResponse)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    client_service.delete_client(db, client_id)
    return SuccessResponse(success=True, message="Client deleted successfully.")


@router.get("/{client_id}/appointments", response_model=SuccessResponse)
def get_client_appointments(
    client_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    client_service.get_client_by_id(db, client_id)  # Ensure client exists
    appointments = appointment_service.get_client_appointments(db, client_id)
    data = [AppointmentOut.model_validate(a).model_dump(mode="json") for a in appointments]
    return SuccessResponse(success=True, message="OK", data=data)


@router.post("/{client_id}/appointments", response_model=SuccessResponse[AppointmentOut], status_code=201)
def create_client_appointment(
    client_id: int,
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    client = client_service.get_client_by_id(db, client_id)
    data.client_id = client_id
    if not data.patient_name:
        data.patient_name = client.name
    if not data.contact_number:
        data.contact_number = client.contact_number
    if data.address is None:
        data.address = client.address
    appointment = appointment_service.create_admin_appointment(db, data)
    return SuccessResponse(success=True, message="Appointment created successfully.", data=appointment)
