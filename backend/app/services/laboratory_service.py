from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import Optional, List, Tuple
from decimal import Decimal

from app.models.laboratory import Laboratory
from app.models.lab_work import LabWork
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


def get_laboratory_payment_summary(db: Session, lab_id: int) -> dict:
    """
    Return aggregated payment totals for a single laboratory.
    - total_cost:        sum of cost across all lab work orders
    - total_paid:        sum of amount_paid across all lab work orders
    - total_pending:     total_cost - total_paid
    - work_count:        total number of lab work orders
    - paid_work_count:   orders where amount_paid >= cost (fully paid)
    - unpaid_work_count: orders with a cost but amount_paid < cost (or no payment)
    """
    lab = get_lab_by_id(db, lab_id)

    rows = (
        db.query(
            sql_func.count(LabWork.id).label("work_count"),
            sql_func.coalesce(sql_func.sum(LabWork.cost), 0).label("total_cost"),
            sql_func.coalesce(sql_func.sum(LabWork.amount_paid), 0).label("total_paid"),
        )
        .filter(LabWork.laboratory_id == lab_id)
        .one()
    )

    total_cost = Decimal(str(rows.total_cost))
    total_paid = Decimal(str(rows.total_paid))
    total_pending = total_cost - total_paid

    # Count fully paid orders (amount_paid is not null and >= cost which is not null)
    paid_count = (
        db.query(sql_func.count(LabWork.id))
        .filter(
            LabWork.laboratory_id == lab_id,
            LabWork.cost.isnot(None),
            LabWork.amount_paid.isnot(None),
            LabWork.amount_paid >= LabWork.cost,
        )
        .scalar()
    ) or 0

    return {
        "laboratory_id": lab.id,
        "laboratory_name": lab.name,
        "total_cost": float(total_cost),
        "total_paid": float(total_paid),
        "total_pending": float(total_pending),
        "work_count": rows.work_count,
        "paid_work_count": paid_count,
        "unpaid_work_count": rows.work_count - paid_count,
    }
