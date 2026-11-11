from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List, Tuple, Dict
from datetime import date
from collections import defaultdict

from app.models.lab_work import LabWork
from app.schemas.lab_work import LabWorkCreate, LabWorkUpdate
from app.utils.exceptions import NotFoundError
import logging

logger = logging.getLogger(__name__)


def _to_out(record: LabWork) -> dict:
    return {
        "id": record.id,
        "patient_name": record.patient_name,
        "client_id": record.client_id,
        "laboratory_id": record.laboratory_id,
        "laboratory_name": record.laboratory.name if record.laboratory else None,
        "work_type": record.work_type.value if hasattr(record.work_type, "value") else str(record.work_type),
        "teeth": record.get_teeth(),
        "status": record.status.value if hasattr(record.status, "value") else str(record.status),
        "work_date": record.work_date,
        "notes": record.notes,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def _to_list(record: LabWork) -> dict:
    return {
        "id": record.id,
        "patient_name": record.patient_name,
        "laboratory_id": record.laboratory_id,
        "laboratory_name": record.laboratory.name if record.laboratory else None,
        "work_type": record.work_type.value if hasattr(record.work_type, "value") else str(record.work_type),
        "teeth": record.get_teeth(),
        "status": record.status.value if hasattr(record.status, "value") else str(record.status),
        "work_date": record.work_date,
        "created_at": record.created_at,
    }


def create_lab_work(db: Session, data: LabWorkCreate) -> LabWork:
    record = LabWork(
        patient_name=data.patient_name,
        client_id=data.client_id,
        laboratory_id=data.laboratory_id,
        work_type=data.work_type,
        status=data.status,
        work_date=data.work_date,
        notes=data.notes,
    )
    record.set_teeth(data.teeth)
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(f"Lab work created: id={record.id}, patient={record.patient_name}")
    return record


def get_lab_work_by_id(db: Session, record_id: int) -> LabWork:
    record = (
        db.query(LabWork)
        .options(joinedload(LabWork.laboratory))
        .filter(LabWork.id == record_id)
        .first()
    )
    if not record:
        raise NotFoundError("Laboratory work record not found.")
    return record


def update_lab_work(db: Session, record_id: int, data: LabWorkUpdate) -> LabWork:
    record = get_lab_work_by_id(db, record_id)
    update_data = data.model_dump(exclude_unset=True)

    # Handle teeth specially — it's stored as JSON
    teeth = update_data.pop("teeth", None)
    if teeth is not None:
        record.set_teeth(teeth)

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    logger.info(f"Lab work updated: id={record_id}")
    return record


def delete_lab_work(db: Session, record_id: int) -> None:
    record = get_lab_work_by_id(db, record_id)
    db.delete(record)
    db.commit()
    logger.info(f"Lab work deleted: id={record_id}")


def list_lab_work(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    work_type: Optional[str] = None,
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    laboratory_id: Optional[int] = None,
) -> Tuple[List[dict], int]:
    query = db.query(LabWork).options(joinedload(LabWork.laboratory))

    if search:
        like = f"%{search}%"
        query = query.filter(LabWork.patient_name.ilike(like))

    if work_type:
        query = query.filter(LabWork.work_type == work_type)

    if status:
        query = query.filter(LabWork.status == status)

    if from_date:
        query = query.filter(LabWork.work_date >= from_date)

    if to_date:
        query = query.filter(LabWork.work_date <= to_date)

    if laboratory_id is not None:
        query = query.filter(LabWork.laboratory_id == laboratory_id)

    total = query.count()
    records = (
        query.order_by(LabWork.work_date.desc(), LabWork.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_to_list(r) for r in records], total


def get_teeth_summary(
    db: Session,
    laboratory_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    status: Optional[str] = None,
) -> dict:
    """
    Aggregate total teeth count and record count per work type.
    Returns all work types that have at least one matching record.
    """
    query = db.query(LabWork)

    if laboratory_id is not None:
        query = query.filter(LabWork.laboratory_id == laboratory_id)

    if from_date:
        query = query.filter(LabWork.work_date >= from_date)

    if to_date:
        query = query.filter(LabWork.work_date <= to_date)

    if status:
        query = query.filter(LabWork.status == status)

    records = query.all()

    # Aggregate in Python because teeth are stored as a JSON text column
    tooth_counts: Dict[str, int] = defaultdict(int)
    record_counts: Dict[str, int] = defaultdict(int)

    for record in records:
        wt = record.work_type.value if hasattr(record.work_type, "value") else str(record.work_type)
        tooth_counts[wt] += len(record.get_teeth())
        record_counts[wt] += 1

    summary = [
        {
            "work_type": wt,
            "tooth_count": tooth_counts[wt],
            "record_count": record_counts[wt],
        }
        for wt in sorted(tooth_counts.keys())
    ]

    total_teeth = sum(tooth_counts.values())
    total_records = sum(record_counts.values())

    return {
        "summary": summary,
        "total_teeth": total_teeth,
        "total_records": total_records,
    }
