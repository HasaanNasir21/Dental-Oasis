from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.schemas.laboratory import LaboratoryCreate, LaboratoryUpdate
from app.services import laboratory_service

router = APIRouter(prefix="/api/admin/laboratories", tags=["Admin - Laboratories"])


@router.get("", response_model=PaginatedResponse)
def list_laboratories(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    search: Optional[str] = Query(default=None, max_length=100),
    is_active: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    records, total = laboratory_service.list_laboratories(db, page, page_size, search, is_active)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=records,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.get("/options", response_model=SuccessResponse)
def get_laboratory_options(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Return all active laboratories for use in dropdowns."""
    options = laboratory_service.get_active_laboratories(db)
    return SuccessResponse(success=True, message="OK", data=options)


@router.post("", response_model=SuccessResponse, status_code=201)
def create_laboratory(
    data: LaboratoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    lab = laboratory_service.create_laboratory(db, data)
    return SuccessResponse(success=True, message="Laboratory created successfully.", data=laboratory_service._to_out(lab))


@router.get("/{lab_id}", response_model=SuccessResponse)
def get_laboratory(
    lab_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    lab = laboratory_service.get_lab_by_id(db, lab_id)
    return SuccessResponse(success=True, message="OK", data=laboratory_service._to_out(lab))


@router.patch("/{lab_id}", response_model=SuccessResponse)
def update_laboratory(
    lab_id: int,
    data: LaboratoryUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    lab = laboratory_service.update_laboratory(db, lab_id, data)
    return SuccessResponse(success=True, message="Laboratory updated successfully.", data=laboratory_service._to_out(lab))


@router.delete("/{lab_id}", response_model=SuccessResponse)
def delete_laboratory(
    lab_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    laboratory_service.delete_laboratory(db, lab_id)
    return SuccessResponse(success=True, message="Laboratory deleted successfully.")
