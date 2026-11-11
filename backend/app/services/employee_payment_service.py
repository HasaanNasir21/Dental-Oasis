from sqlalchemy.orm import Session
from sqlalchemy import or_, func, extract
from typing import Optional, List, Tuple
from datetime import date, timedelta
import calendar

from app.models.employee import Employee
from app.models.employee_payment import EmployeePayment
from app.schemas.employee_payment import (
    EmployeePaymentCreate,
    EmployeePaymentUpdate,
    PaymentSummary,
)
from app.utils.exceptions import NotFoundError
import logging

logger = logging.getLogger(__name__)


def _to_out(payment: EmployeePayment, employee_name: str = "") -> dict:
    return {
        "id": payment.id,
        "employee_id": payment.employee_id,
        "employee_name": employee_name,
        "amount": float(payment.amount),
        "payment_date": payment.payment_date,
        "notes": payment.notes,
        "created_at": payment.created_at,
        "updated_at": payment.updated_at,
    }


def _to_list(payment: EmployeePayment, employee_name: str = "") -> dict:
    return {
        "id": payment.id,
        "employee_id": payment.employee_id,
        "employee_name": employee_name,
        "amount": float(payment.amount),
        "payment_date": payment.payment_date,
        "notes": payment.notes,
        "created_at": payment.created_at,
    }


def create_payment(db: Session, data: EmployeePaymentCreate) -> EmployeePayment:
    # Verify employee exists
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise NotFoundError("Employee not found.")

    payment = EmployeePayment(
        employee_id=data.employee_id,
        amount=data.amount,
        payment_date=data.payment_date,
        notes=data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    logger.info(f"Payment created: id={payment.id}, employee_id={payment.employee_id}, amount={payment.amount}")
    return payment


def get_payment_by_id(db: Session, payment_id: int) -> EmployeePayment:
    payment = db.query(EmployeePayment).filter(EmployeePayment.id == payment_id).first()
    if not payment:
        raise NotFoundError("Payment record not found.")
    return payment


def update_payment(db: Session, payment_id: int, data: EmployeePaymentUpdate) -> EmployeePayment:
    payment = get_payment_by_id(db, payment_id)
    update_data = data.model_dump(exclude_unset=True)

    # If employee_id is changing, verify the new employee exists
    if "employee_id" in update_data and update_data["employee_id"] is not None:
        employee = db.query(Employee).filter(Employee.id == update_data["employee_id"]).first()
        if not employee:
            raise NotFoundError("Employee not found.")

    for field, value in update_data.items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    logger.info(f"Payment updated: id={payment_id}")
    return payment


def delete_payment(db: Session, payment_id: int) -> None:
    payment = get_payment_by_id(db, payment_id)
    db.delete(payment)
    db.commit()
    logger.info(f"Payment deleted: id={payment_id}")


def list_payments(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    employee_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> Tuple[List[dict], int]:
    query = db.query(EmployeePayment, Employee.name).join(
        Employee, EmployeePayment.employee_id == Employee.id, isouter=True
    )

    if employee_id:
        query = query.filter(EmployeePayment.employee_id == employee_id)
    if from_date:
        query = query.filter(EmployeePayment.payment_date >= from_date)
    if to_date:
        query = query.filter(EmployeePayment.payment_date <= to_date)

    total = query.count()
    rows = (
        query.order_by(EmployeePayment.payment_date.desc(), EmployeePayment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_to_list(p, emp_name) for (p, emp_name) in rows], total


def get_employee_payments(db: Session, employee_id: int) -> List[dict]:
    """Return all payments for a specific employee, newest first."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise NotFoundError("Employee not found.")

    payments = (
        db.query(EmployeePayment)
        .filter(EmployeePayment.employee_id == employee_id)
        .order_by(EmployeePayment.payment_date.desc(), EmployeePayment.created_at.desc())
        .all()
    )
    return [_to_out(p, employee.name) for p in payments]


def get_payment_summary(
    db: Session,
    employee_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> dict:
    """Compute daily, weekly, monthly, and per-employee payment summaries."""
    query = db.query(EmployeePayment, Employee.name).join(
        Employee, EmployeePayment.employee_id == Employee.id, isouter=True
    )

    if employee_id:
        query = query.filter(EmployeePayment.employee_id == employee_id)
    if from_date:
        query = query.filter(EmployeePayment.payment_date >= from_date)
    if to_date:
        query = query.filter(EmployeePayment.payment_date <= to_date)

    rows = query.order_by(EmployeePayment.payment_date.desc()).all()

    total_amount = sum(float(p.amount) for p, _ in rows)
    total_count = len(rows)
    employee_set = set(p.employee_id for p, _ in rows)

    # Daily totals
    daily_map: dict = {}
    for p, _ in rows:
        d = p.payment_date.isoformat() if isinstance(p.payment_date, date) else str(p.payment_date)
        if d not in daily_map:
            daily_map[d] = {"date": d, "total": 0.0, "count": 0}
        daily_map[d]["total"] += float(p.amount)
        daily_map[d]["count"] += 1
    daily_totals = sorted(daily_map.values(), key=lambda x: x["date"], reverse=True)

    # Weekly totals (ISO week: Monday start)
    weekly_map: dict = {}
    for p, _ in rows:
        pd = p.payment_date
        week_start = pd - timedelta(days=pd.weekday())  # Monday
        wk = week_start.isoformat()
        if wk not in weekly_map:
            weekly_map[wk] = {"week_start": wk, "total": 0.0, "count": 0}
        weekly_map[wk]["total"] += float(p.amount)
        weekly_map[wk]["count"] += 1
    weekly_totals = sorted(weekly_map.values(), key=lambda x: x["week_start"], reverse=True)

    # Monthly totals
    monthly_map: dict = {}
    for p, _ in rows:
        key = (p.payment_date.year, p.payment_date.month)
        if key not in monthly_map:
            monthly_map[key] = {"year": key[0], "month": key[1], "total": 0.0, "count": 0}
        monthly_map[key]["total"] += float(p.amount)
        monthly_map[key]["count"] += 1
    monthly_totals = sorted(
        monthly_map.values(), key=lambda x: (x["year"], x["month"]), reverse=True
    )

    # Per-employee totals
    emp_map: dict = {}
    for p, emp_name in rows:
        eid = p.employee_id
        if eid not in emp_map:
            emp_map[eid] = {"employee_id": eid, "employee_name": emp_name or "", "total": 0.0, "count": 0}
        emp_map[eid]["total"] += float(p.amount)
        emp_map[eid]["count"] += 1
    employee_totals = sorted(emp_map.values(), key=lambda x: x["total"], reverse=True)

    return {
        "total_amount": round(total_amount, 2),
        "total_count": total_count,
        "employee_count": len(employee_set),
        "daily_totals": daily_totals,
        "weekly_totals": weekly_totals,
        "monthly_totals": monthly_totals,
        "employee_totals": employee_totals,
    }


def get_employee_summary(db: Session, employee_id: int) -> dict:
    """Return per-employee summary with monthly breakdown."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise NotFoundError("Employee not found.")

    payments = (
        db.query(EmployeePayment)
        .filter(EmployeePayment.employee_id == employee_id)
        .order_by(EmployeePayment.payment_date.desc())
        .all()
    )

    total_paid = sum(float(p.amount) for p in payments)
    payment_count = len(payments)

    # Monthly breakdown
    monthly_map: dict = {}
    for p in payments:
        key = (p.payment_date.year, p.payment_date.month)
        if key not in monthly_map:
            monthly_map[key] = {"year": key[0], "month": key[1], "total": 0.0, "count": 0}
        monthly_map[key]["total"] += float(p.amount)
        monthly_map[key]["count"] += 1
    monthly_totals = sorted(
        monthly_map.values(), key=lambda x: (x["year"], x["month"]), reverse=True
    )

    return {
        "employee_id": employee_id,
        "employee_name": employee.name,
        "total_paid": round(total_paid, 2),
        "payment_count": payment_count,
        "monthly_totals": monthly_totals,
    }
