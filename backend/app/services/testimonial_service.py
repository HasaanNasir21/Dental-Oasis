from sqlalchemy.orm import Session
from typing import List, Tuple
from app.models.testimonial import Testimonial
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate
from app.utils.exceptions import NotFoundError
import logging

logger = logging.getLogger(__name__)


def get_published_testimonials(db: Session) -> List[Testimonial]:
    return (
        db.query(Testimonial)
        .filter(Testimonial.is_published == True)
        .order_by(Testimonial.created_at.desc())
        .all()
    )


def list_testimonials_admin(db: Session, page: int = 1, page_size: int = 20) -> Tuple[List[Testimonial], int]:
    query = db.query(Testimonial).order_by(Testimonial.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_testimonial_by_id(db: Session, testimonial_id: int) -> Testimonial:
    t = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not t:
        raise NotFoundError("Testimonial not found.")
    return t


def create_testimonial(db: Session, data: TestimonialCreate) -> Testimonial:
    t = Testimonial(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def update_testimonial(db: Session, testimonial_id: int, data: TestimonialUpdate) -> Testimonial:
    t = get_testimonial_by_id(db, testimonial_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(t, field, value)
    db.commit()
    db.refresh(t)
    return t


def delete_testimonial(db: Session, testimonial_id: int) -> None:
    t = get_testimonial_by_id(db, testimonial_id)
    db.delete(t)
    db.commit()
