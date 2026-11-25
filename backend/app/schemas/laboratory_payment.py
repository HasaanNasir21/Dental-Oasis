from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import date, datetime


class LaboratoryPaymentBase(BaseModel):
    laboratory_id: int
    amount: Decimal
    payment_date: date
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Payment amount must be greater than zero.")
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Notes must not exceed 500 characters.")
            return v if v else None
        return v


class LaboratoryPaymentCreate(LaboratoryPaymentBase):
    pass


class LaboratoryPaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Payment amount must be greater than zero.")
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Notes must not exceed 500 characters.")
            return v if v else None
        return v


class LaboratoryPaymentOut(BaseModel):
    id: int
    laboratory_id: int
    laboratory_name: Optional[str] = None
    amount: Decimal
    payment_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MonthlyPaymentSummary(BaseModel):
    """Summary of payments for a specific month."""
    year: int
    month: int
    total_amount: Decimal
    payment_count: int
    payments: list[LaboratoryPaymentOut]


class LaboratoryPaymentStats(BaseModel):
    """Overall payment statistics for a laboratory."""
    laboratory_id: int
    laboratory_name: str
    current_month_total: Decimal
    current_month_count: int
    all_time_total: Decimal
    all_time_count: int
