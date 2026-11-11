from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from datetime import datetime


class LaboratoryBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Laboratory name is required.")
        v = v.strip()
        if len(v) > 255:
            raise ValueError("Laboratory name must not exceed 255 characters.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 50:
                raise ValueError("Phone must not exceed 50 characters.")
            return v if v else None
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 255:
                raise ValueError("Email must not exceed 255 characters.")
            return v if v else None
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

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Notes must not exceed 5000 characters.")
            return v if v else None
        return v


class LaboratoryCreate(LaboratoryBase):
    pass


class LaboratoryUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 1:
                raise ValueError("Laboratory name is required.")
            if len(v) > 255:
                raise ValueError("Laboratory name must not exceed 255 characters.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 50:
                raise ValueError("Phone must not exceed 50 characters.")
            return v if v else None
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 255:
                raise ValueError("Email must not exceed 255 characters.")
            return v if v else None
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

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Notes must not exceed 5000 characters.")
            return v if v else None
        return v


class LaboratoryOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LaboratoryOption(BaseModel):
    """Minimal shape for dropdown selectors."""
    id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}
