from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import SuccessResponse
from app.schemas.appointment import PublicAppointmentCreate, AppointmentOut
from app.schemas.service import ServiceOut, ServiceList
from app.schemas.testimonial import TestimonialOut
from app.schemas.clinic import ClinicInfoOut
from app.services import appointment_service, testimonial_service, settings_service
from app.models.service import Service
from app.utils.exceptions import NotFoundError
from app.limiter import limiter
from typing import List

router = APIRouter(prefix="/api", tags=["Public"])


@router.get("/clinic", response_model=SuccessResponse[ClinicInfoOut])
def get_clinic_info(db: Session = Depends(get_db)):
    """Return public clinic information. Does not include admin credentials."""
    data = settings_service.get_clinic_info(db)
    return SuccessResponse(success=True, message="OK", data=data)


@router.get("/services", response_model=SuccessResponse[List[ServiceList]])
def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.is_active == True).order_by(Service.id).all()  # noqa: E712
    return SuccessResponse(success=True, message="OK", data=services)


@router.get("/services/{slug}", response_model=SuccessResponse[ServiceOut])
def get_service(slug: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.slug == slug, Service.is_active == True).first()  # noqa: E712
    if not service:
        raise NotFoundError("Service not found.")
    return SuccessResponse(success=True, message="OK", data=service)


@router.post("/appointments", response_model=SuccessResponse[AppointmentOut], status_code=201)
@limiter.limit("5/minute")
def create_public_appointment(
    request: Request,
    data: PublicAppointmentCreate,
    db: Session = Depends(get_db),
):
    """Public appointment request — creates a PENDING request, not a confirmed appointment."""
    appointment = appointment_service.create_public_appointment(db, data)
    return SuccessResponse(
        success=True,
        message="Appointment request submitted successfully.",
        data=appointment,
    )


@router.get("/testimonials", response_model=SuccessResponse[List[TestimonialOut]])
def get_testimonials(db: Session = Depends(get_db)):
    items = testimonial_service.get_published_testimonials(db)
    return SuccessResponse(success=True, message="OK", data=items)
