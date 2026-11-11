from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import math

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.schemas.employee_payment import EmployeePaymentCreate, EmployeePaymentUpdate
from app.services import employee_payment_service

router = APIRouter(prefix="/api/admin/employee-payments", tags=["Admin - Employee Payments"])


@router.get("/summary", response_model=SuccessResponse)
def get_summary(
    employee_id: Optional[int] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Daily, weekly, monthly, and per-employee payment summaries."""
    summary = employee_payment_service.get_payment_summary(db, employee_id, from_date, to_date)
    return SuccessResponse(success=True, message="OK", data=summary)


@router.get("", response_model=PaginatedResponse)
def list_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    employee_id: Optional[int] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    payments, total = employee_payment_service.list_payments(
        db, page, page_size, employee_id, from_date, to_date
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        data=payments,
        meta=PaginationMeta(total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=SuccessResponse, status_code=201)
def create_payment(
    data: EmployeePaymentCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    payment = employee_payment_service.create_payment(db, data)
    # Get employee name for the response
    from app.models.employee import Employee
    emp = db.query(Employee).filter(Employee.id == payment.employee_id).first()
    out = employee_payment_service._to_out(payment, emp.name if emp else "")
    return SuccessResponse(success=True, message="Payment recorded successfully.", data=out)


@router.get("/{payment_id}", response_model=SuccessResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    payment = employee_payment_service.get_payment_by_id(db, payment_id)
    from app.models.employee import Employee
    emp = db.query(Employee).filter(Employee.id == payment.employee_id).first()
    out = employee_payment_service._to_out(payment, emp.name if emp else "")
    return SuccessResponse(success=True, message="OK", data=out)


@router.patch("/{payment_id}", response_model=SuccessResponse)
def update_payment(
    payment_id: int,
    data: EmployeePaymentUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    payment = employee_payment_service.update_payment(db, payment_id, data)
    from app.models.employee import Employee
    emp = db.query(Employee).filter(Employee.id == payment.employee_id).first()
    out = employee_payment_service._to_out(payment, emp.name if emp else "")
    return SuccessResponse(success=True, message="Payment updated successfully.", data=out)


@router.delete("/{payment_id}", response_model=SuccessResponse)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    employee_payment_service.delete_payment(db, payment_id)
    return SuccessResponse(success=True, message="Payment deleted successfully.")
