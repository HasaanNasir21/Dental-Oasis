from sqlalchemy.orm import Session
from typing import Optional, List, Tuple

from app.models.laboratory import Laboratory
from app.schemas.laboratory import LaboratoryCreate, LaboratoryUpdate
from app.utils.exceptions import NotFoundError, ConflictError
import logging

logger = logging.getLogger(__name__)


def _to_out(lab: Laboratory) -> dict:
    return {
        "id": lab.id,
        "name": lab.name,
        "phone": lab.phone,
        "email": lab.email,
        "address": lab.address,
        "notes": lab.notes,
        "is_active": lab.is_active,
        "created_at": lab.created_at,
        "updated_at": lab.updated_at,
    }


def get_lab_by_id(db: Session, lab_id: int) -> Laboratory:
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise NotFoundError("Laboratory not found.")
    return lab


def create_laboratory(db: Session, data: LaboratoryCreate) -> Laboratory:
    existing = db.query(Laboratory).filter(Laboratory.name == data.name).first()
    if existing:
        raise ConflictError(f"A laboratory named '{data.name}' already exists.")

    lab = Laboratory(
        name=data.name,
        phone=data.phone,
        email=data.email,
        address=data.address,
        notes=data.notes,
        is_active=data.is_active,
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)
    logger.info(f"Laboratory created: id={lab.id}, name={lab.name}")
    return lab


def update_laboratory(db: Session, lab_id: int, data: LaboratoryUpdate) -> Laboratory:
    lab = get_lab_by_id(db, lab_id)
    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] != lab.name:
        conflict = db.query(Laboratory).filter(Laboratory.name == update_data["name"]).first()
        if conflict:
            raise ConflictError(f"A laboratory named '{update_data['name']}' already exists.")

    for field, value in update_data.items():
        setattr(lab, field, value)

    db.commit()
    db.refresh(lab)
    logger.info(f"Laboratory updated: id={lab_id}")
    return lab


def delete_laboratory(db: Session, lab_id: int) -> None:
    lab = get_lab_by_id(db, lab_id)
    db.delete(lab)
    db.commit()
    logger.info(f"Laboratory deleted: id={lab_id}")


def list_laboratories(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Tuple[List[dict], int]:
    query = db.query(Laboratory)

    if search:
        like = f"%{search}%"
        query = query.filter(Laboratory.name.ilike(like))

    if is_active is not None:
        query = query.filter(Laboratory.is_active == is_active)

    total = query.count()
    records = (
        query.order_by(Laboratory.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_to_out(r) for r in records], total


def get_active_laboratories(db: Session) -> List[dict]:
    """Return all active laboratories as lightweight option objects for dropdowns."""
    labs = (
        db.query(Laboratory)
        .filter(Laboratory.is_active == True)  # noqa: E712
        .order_by(Laboratory.name.asc())
        .all()
    )
    return [{"id": lab.id, "name": lab.name, "is_active": lab.is_active} for lab in labs]
