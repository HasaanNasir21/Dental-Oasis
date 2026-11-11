from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List, Tuple
from app.models.employee import Employee
from app.models.employee_payment import EmployeePayment
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.utils.exceptions import NotFoundError
import logging

logger = logging.getLogger(__name__)


def _compute_totals(db: Session, employee_id: int) -> Tuple[float, int]:
    """Return (total_paid, payment_count) for an employee."""
    result = db.query(
        func.coalesce(func.sum(EmployeePayment.amount), 0),
        func.count(EmployeePayment.id),
    ).filter(EmployeePayment.employee_id == employee_id).first()
    total = float(result[0] or 0)
    count = int(result[1] or 0)
    return total, count


def _to_out(db: Session, employee: Employee) -> dict:
    """Build the EmployeeOut dict with computed totals."""
    total, count = _compute_totals(db, employee.id)
    return {
        "id": employee.id,
        "name": employee.name,
        "contact_number": employee.contact_number,
        "role": employee.role,
        "notes": employee.notes,
        "is_active": employee.is_active,
        "total_paid": total,
        "payment_count": count,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
    }


def _to_list(db: Session, employee: Employee) -> dict:
    """Build the EmployeeList dict with computed totals."""
    total, count = _compute_totals(db, employee.id)
    return {
        "id": employee.id,
        "name": employee.name,
        "contact_number": employee.contact_number,
        "role": employee.role,
        "is_active": employee.is_active,
        "total_paid": total,
        "payment_count": count,
        "created_at": employee.created_at,
    }


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    employee = Employee(
        name=data.name,
        contact_number=data.contact_number,
        role=data.role,
        notes=data.notes,
        is_active=data.is_active,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    logger.info(f"Employee created: id={employee.id}, name={employee.name}")
    return employee


def get_employee_by_id(db: Session, employee_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise NotFoundError("Employee not found.")
    return employee


def update_employee(db: Session, employee_id: int, data: EmployeeUpdate) -> Employee:
    employee = get_employee_by_id(db, employee_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    logger.info(f"Employee updated: id={employee_id}")
    return employee


def delete_employee(db: Session, employee_id: int) -> None:
    employee = get_employee_by_id(db, employee_id)
    db.delete(employee)
    db.commit()
    logger.info(f"Employee deleted: id={employee_id}")


def list_employees(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
) -> Tuple[List[dict], int]:
    query = db.query(Employee)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Employee.name.ilike(like),
                Employee.role.ilike(like),
                Employee.contact_number.ilike(like),
            )
        )

    total = query.count()
    employees = (
        query.order_by(Employee.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_to_list(db, e) for e in employees], total


def list_all_active(db: Session) -> List[Employee]:
    """Return all active employees for dropdown selectors."""
    return db.query(Employee).filter(Employee.is_active == True).order_by(Employee.name.asc()).all()
