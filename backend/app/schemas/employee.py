from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class EmployeeBase(BaseModel):
    name: str
    contact_number: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required.")
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        if len(v) > 255:
            raise ValueError("Name must not exceed 255 characters.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError("Role must not exceed 100 characters.")
            return v if v else None
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


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    contact_number: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters.")
            if len(v) > 255:
                raise ValueError("Name must not exceed 255 characters.")
        return v


class EmployeeOut(BaseModel):
    id: int
    name: str
    contact_number: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    total_paid: float = 0.0
    payment_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeList(BaseModel):
    id: int
    name: str
    contact_number: Optional[str] = None
    role: Optional[str] = None
    is_active: bool
    total_paid: float = 0.0
    payment_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
