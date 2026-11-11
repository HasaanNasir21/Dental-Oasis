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
    laboratory_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    records, total = lab_work_service.list_lab_work(
        db, page, page_size, search, work_type, status, from_date, to_date, laboratory_id
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=records,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.get("/teeth-summary", response_model=SuccessResponse)
def get_teeth_summary(
    laboratory_id: Optional[int] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """
    Return total teeth count and record count per work type.
    Defaults to the current calendar month when no date range is supplied.
    Optionally filter by laboratory or status.
    """
    from datetime import date as _date
    import calendar

    # Default to current month if no dates provided
    if from_date is None and to_date is None:
        today = _date.today()
        from_date = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        to_date = today.replace(day=last_day)

    summary = lab_work_service.get_teeth_summary(
        db,
        laboratory_id=laboratory_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
    )
    # Include the resolved date range in the response so the frontend knows what month was used
    summary["from_date"] = str(from_date)
    summary["to_date"] = str(to_date)
    return SuccessResponse(success=True, message="OK", data=summary)


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
