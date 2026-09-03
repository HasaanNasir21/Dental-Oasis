from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut, ServiceList
from app.schemas.common import SuccessResponse
from app.models.service import Service
from app.utils.exceptions import NotFoundError
from typing import List

router = APIRouter(prefix="/api/admin/services", tags=["Admin - Services"])


@router.get("", response_model=SuccessResponse[List[ServiceOut]])
def list_services(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    services = db.query(Service).order_by(Service.id).all()
    return SuccessResponse(success=True, message="OK", data=services)


@router.post("", response_model=SuccessResponse[ServiceOut], status_code=201)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    service = Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return SuccessResponse(success=True, message="Service created successfully.", data=service)


@router.patch("/{service_id}", response_model=SuccessResponse[ServiceOut])
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise NotFoundError("Service not found.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return SuccessResponse(success=True, message="Service updated successfully.", data=service)


@router.delete("/{service_id}", response_model=SuccessResponse)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise NotFoundError("Service not found.")
    db.delete(service)
    db.commit()
    return SuccessResponse(success=True, message="Service deleted successfully.")
