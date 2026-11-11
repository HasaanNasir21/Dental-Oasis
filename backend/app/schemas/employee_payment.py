from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class EmployeePaymentBase(BaseModel):
    employee_id: int
    amount: float
    payment_date: date
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v is None:
            raise ValueError("Amount is required.")
        if v <= 0:
            raise ValueError("Amount must be greater than zero.")
        # Round to 2 decimal places
        return round(float(v), 2)

    @field_validator("payment_date")
    @classmethod
    def validate_payment_date(cls, v: date) -> date:
        if v is None:
            raise ValueError("Payment date is required.")
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Notes must not exceed 5000 characters.")
            return v if v else None
        return v


class EmployeePaymentCreate(EmployeePaymentBase):
    pass


class EmployeePaymentUpdate(BaseModel):
    employee_id: Optional[int] = None
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v <= 0:
                raise ValueError("Amount must be greater than zero.")
            return round(float(v), 2)
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Notes must not exceed 5000 characters.")
            return v if v else None
        return v


class EmployeePaymentOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str = ""
    amount: float
    payment_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeePaymentList(BaseModel):
    id: int
    employee_id: int
    employee_name: str = ""
    amount: float
    payment_date: date
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentSummary(BaseModel):
    """Summary of payments for a filtered period."""
    total_amount: float
    total_count: int
    employee_count: int
    daily_totals: List[dict] = []  # [{date: "2026-11-09", total: 1000.0, count: 1}]
    weekly_totals: List[dict] = []  # [{week_start: "2026-11-04", total: 5000.0, count: 3}]
    monthly_totals: List[dict] = []  # [{year: 2026, month: 11, total: 15000.0, count: 10}]
    employee_totals: List[dict] = []  # [{employee_id: 1, employee_name: "Ali", total: 5000.0, count: 5}]


class EmployeeSummary(BaseModel):
    """Summary for a single employee."""
    employee_id: int
    employee_name: str
    total_paid: float
    payment_count: int
    monthly_totals: List[dict] = []  # [{year, month, total, count}]
