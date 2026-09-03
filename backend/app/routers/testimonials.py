from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate, TestimonialOut
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import testimonial_service
import math

router = APIRouter(prefix="/api/admin/testimonials", tags=["Admin - Testimonials"])


@router.get("", response_model=PaginatedResponse[TestimonialOut])
def list_testimonials(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    items, total = testimonial_service.list_testimonials_admin(db, page, page_size)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=SuccessResponse[TestimonialOut], status_code=201)
def create_testimonial(
    data: TestimonialCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    t = testimonial_service.create_testimonial(db, data)
    return SuccessResponse(success=True, message="Testimonial created successfully.", data=t)


@router.patch("/{testimonial_id}", response_model=SuccessResponse[TestimonialOut])
def update_testimonial(
    testimonial_id: int,
    data: TestimonialUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    t = testimonial_service.update_testimonial(db, testimonial_id, data)
    return SuccessResponse(success=True, message="Testimonial updated successfully.", data=t)


@router.delete("/{testimonial_id}", response_model=SuccessResponse)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    testimonial_service.delete_testimonial(db, testimonial_id)
    return SuccessResponse(success=True, message="Testimonial deleted successfully.")
