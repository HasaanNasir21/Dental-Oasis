from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, date, time
from decimal import Decimal
from app.models.appointment import AppointmentStatus, AppointmentReason
import re
import json


def validate_contact_number(v: str) -> str:
    if not v or not v.strip():
        raise ValueError("Contact number is required.")
    v = v.strip()
    if len(v) > 20:
        raise ValueError("Contact number must not exceed 20 characters.")
    if not re.match(r"^[0-9+\-\s()]{7,20}$", v):
        raise ValueError("Please enter a valid contact number.")
    return v


class PublicAppointmentCreate(BaseModel):
    patient_name: str
    contact_number: str
    address: Optional[str] = None
    reason: str
    other_problem: Optional[str] = None

    @field_validator("patient_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Full name is required.")
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        if len(v) > 255:
            raise ValueError("Name must not exceed 255 characters.")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, v: str) -> str:
        return validate_contact_number(v)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Reason for visit is required.")
        valid_reasons = [r.value for r in AppointmentReason]
        if v not in valid_reasons:
            raise ValueError(f"Invalid reason. Must be one of: {', '.join(valid_reasons)}")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 1000:
                raise ValueError("Address must not exceed 1000 characters.")
            return v if v else None
        return v

    @field_validator("other_problem")
    @classmethod
    def validate_other_problem(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError("Problem description must not exceed 2000 characters.")
            return v if v else None
        return v

    @model_validator(mode="after")
    def validate_other_required_when_other_reason(self) -> "PublicAppointmentCreate":
        if self.reason == AppointmentReason.OTHER.value:
            if not self.other_problem or not self.other_problem.strip():
                raise ValueError("Please describe your problem when 'Other' is selected.")
        return self


class AppointmentCreate(BaseModel):
    client_id: Optional[int] = None
    patient_name: str
    contact_number: str
    address: Optional[str] = None
    reason: str
    other_problem: Optional[str] = None
    # Multiple treatments — takes precedence over `reason` for display when populated.
    # Each entry must be a valid AppointmentReason value.
    treatments: Optional[List[str]] = None
    status: AppointmentStatus = AppointmentStatus.CONFIRMED
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    notes: Optional[str] = None
    total_amount: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None

    @field_validator("patient_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Patient name is required.")
        v = v.strip()
        if len(v) < 2 or len(v) > 255:
            raise ValueError("Name must be between 2 and 255 characters.")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, v: str) -> str:
        return validate_contact_number(v)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        valid_reasons = [r.value for r in AppointmentReason]
        if v not in valid_reasons:
            raise ValueError(f"Invalid reason.")
        return v

    @field_validator("treatments")
    @classmethod
    def validate_treatments(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            valid_reasons = [r.value for r in AppointmentReason]
            for treatment in v:
                if treatment not in valid_reasons:
                    raise ValueError(f"Invalid treatment: {treatment}")
        return v

    @field_validator("total_amount", "amount_paid")
    @classmethod
    def validate_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Amount must be zero or positive.")
        return v


class AppointmentUpdate(BaseModel):
    client_id: Optional[int] = None
    patient_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    reason: Optional[str] = None
    other_problem: Optional[str] = None
    # Multiple treatments — send an empty list [] to clear back to single-reason mode.
    treatments: Optional[List[str]] = None
    status: Optional[AppointmentStatus] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    notes: Optional[str] = None
    total_amount: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None

    @field_validator("patient_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2 or len(v) > 255:
                raise ValueError("Name must be between 2 and 255 characters.")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_contact_number(v)
        return v

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_reasons = [r.value for r in AppointmentReason]
            if v not in valid_reasons:
                raise ValueError("Invalid reason.")
        return v

    @field_validator("treatments")
    @classmethod
    def validate_treatments(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            valid_reasons = [r.value for r in AppointmentReason]
            for treatment in v:
                if treatment not in valid_reasons:
                    raise ValueError(f"Invalid treatment: {treatment}")
        return v

    @field_validator("total_amount", "amount_paid")
    @classmethod
    def validate_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Amount must be zero or positive.")
        return v


class AppointmentOut(BaseModel):
    id: int
    client_id: Optional[int] = None
    patient_name: str
    contact_number: str
    address: Optional[str] = None
    reason: str
    other_problem: Optional[str] = None
    # Decoded list of treatment names. Populated from the DB `treatments` JSON column.
    # Falls back to [reason] when treatments column is NULL (legacy appointments).
    treatments: Optional[List[str]] = None
    status: AppointmentStatus
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    notes: Optional[str] = None
    total_amount: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    # Date when amount_paid was last recorded — used for monthly revenue bucketing.
    last_payment_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    files: List["AppointmentFileOut"] = []

    model_config = {"from_attributes": True}

    @field_validator("treatments", mode="before")
    @classmethod
    def decode_treatments(cls, v):
        """Decode JSON string from DB into a Python list."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return [v]
        return v


# Imported here to avoid circular import — AppointmentFileOut needs AppointmentOut
# to be defined first (it's used inside it via forward ref).
from app.schemas.appointment_file import AppointmentFileOut  # noqa: E402
AppointmentOut.model_rebuild()


class AppointmentList(BaseModel):
    id: int
    client_id: Optional[int] = None
    patient_name: str
    contact_number: str
    reason: str
    treatments: Optional[List[str]] = None
    status: AppointmentStatus
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    total_amount: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("treatments", mode="before")
    @classmethod
    def decode_treatments(cls, v):
        """Decode JSON string from DB into a Python list."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return [v]
        return v
