from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeList
from app.services import employee_service, employee_payment_service

router = APIRouter(prefix="/api/admin/employees", tags=["Admin - Employees"])


@router.get("", response_model=PaginatedResponse)
def list_employees(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    search: Optional[str] = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    employees, total = employee_service.list_employees(db, page, page_size, search)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=employees,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=SuccessResponse, status_code=201)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    employee = employee_service.create_employee(db, data)
    out = employee_service._to_out(db, employee)
    return SuccessResponse(success=True, message="Employee created successfully.", data=out)


@router.get("/all", response_model=SuccessResponse)
def list_all_employees(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Return all active employees (for dropdown selectors)."""
    employees = employee_service.list_all_active(db)
    data = [
        {"id": e.id, "name": e.name, "role": e.role}
        for e in employees
    ]
    return SuccessResponse(success=True, message="OK", data=data)


@router.get("/{employee_id}", response_model=SuccessResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    employee = employee_service.get_employee_by_id(db, employee_id)
    out = employee_service._to_out(db, employee)
    return SuccessResponse(success=True, message="OK", data=out)


@router.patch("/{employee_id}", response_model=SuccessResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    employee = employee_service.update_employee(db, employee_id, data)
    out = employee_service._to_out(db, employee)
    return SuccessResponse(success=True, message="Employee updated successfully.", data=out)


@router.delete("/{employee_id}", response_model=SuccessResponse)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    employee_service.delete_employee(db, employee_id)
    return SuccessResponse(success=True, message="Employee deleted successfully.")


@router.get("/{employee_id}/payments", response_model=SuccessResponse)
def get_employee_payments(
    employee_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    payments = employee_payment_service.get_employee_payments(db, employee_id)
    return SuccessResponse(success=True, message="OK", data=payments)


@router.get("/{employee_id}/summary", response_model=SuccessResponse)
def get_employee_summary(
    employee_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    summary = employee_payment_service.get_employee_summary(db, employee_id)
    return SuccessResponse(success=True, message="OK", data=summary)
