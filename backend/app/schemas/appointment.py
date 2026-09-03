from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime, date, time
from app.models.appointment import AppointmentStatus, AppointmentReason
import re


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
    status: AppointmentStatus = AppointmentStatus.CONFIRMED
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    notes: Optional[str] = None

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


class AppointmentUpdate(BaseModel):
    client_id: Optional[int] = None
    patient_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    reason: Optional[str] = None
    other_problem: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    notes: Optional[str] = None

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


class AppointmentOut(BaseModel):
    id: int
    client_id: Optional[int] = None
    patient_name: str
    contact_number: str
    address: Optional[str] = None
    reason: str
    other_problem: Optional[str] = None
    status: AppointmentStatus
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentList(BaseModel):
    id: int
    client_id: Optional[int] = None
    patient_name: str
    contact_number: str
    reason: str
    status: AppointmentStatus
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    created_at: datetime

    model_config = {"from_attributes": True}
