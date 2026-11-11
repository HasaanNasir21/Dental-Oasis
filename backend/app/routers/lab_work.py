from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import math

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.schemas.lab_work import LabWorkCreate, LabWorkUpdate
from app.services import lab_work_service

router = APIRouter(prefix="/api/admin/lab-work", tags=["Admin - Laboratory Work"])


@router.get("", response_model=PaginatedResponse)
def list_lab_work(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    search: Optional[str] = Query(default=None, max_length=100),
    work_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    records, total = lab_work_service.list_lab_work(
        db, page, page_size, search, work_type, status, from_date, to_date
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=records,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=SuccessResponse, status_code=201)
def create_lab_work(
    data: LabWorkCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    record = lab_work_service.create_lab_work(db, data)
    out = lab_work_service._to_out(record)
    return SuccessResponse(success=True, message="Laboratory work created successfully.", data=out)


@router.get("/{record_id}", response_model=SuccessResponse)
def get_lab_work(
    record_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    record = lab_work_service.get_lab_work_by_id(db, record_id)
    out = lab_work_service._to_out(record)
    return SuccessResponse(success=True, message="OK", data=out)


@router.patch("/{record_id}", response_model=SuccessResponse)
def update_lab_work(
    record_id: int,
    data: LabWorkUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    record = lab_work_service.update_lab_work(db, record_id, data)
    out = lab_work_service._to_out(record)
    return SuccessResponse(success=True, message="Laboratory work updated successfully.", data=out)


@router.delete("/{record_id}", response_model=SuccessResponse)
def delete_lab_work(
    record_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    lab_work_service.delete_lab_work(db, record_id)
    return SuccessResponse(success=True, message="Laboratory work deleted successfully.")
