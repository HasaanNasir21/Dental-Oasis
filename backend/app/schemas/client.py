from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
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


class ClientBase(BaseModel):
    name: str
    contact_number: str
    address: Optional[str] = None
    notes: Optional[str] = None

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

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, v: str) -> str:
        return validate_contact_number(v)

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


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

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

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_contact_number(v)
        return v


class ClientOut(BaseModel):
    id: int
    name: str
    contact_number: str
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientList(BaseModel):
    id: int
    name: str
    contact_number: str
    address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
