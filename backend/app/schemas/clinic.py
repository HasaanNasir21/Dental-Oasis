from pydantic import BaseModel, field_validator
from typing import Optional
import re


class OpeningHours(BaseModel):
    monday_saturday: str
    sunday: str


class ClinicInfoOut(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    google_maps_url: Optional[str] = None
    opening_hours: OpeningHours
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None


class ClinicSettingsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    google_maps_url: Optional[str] = None
    hours_monday_saturday: Optional[str] = None
    hours_sunday: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2 or len(v) > 255:
                raise ValueError("Clinic name must be between 2 and 255 characters.")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 5 or len(v) > 1000:
                raise ValueError("Address must be between 5 and 1000 characters.")
        return v

    @field_validator("phone", "whatsapp")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) > 50:
                raise ValueError("Phone number is too long.")
            if not re.match(r"^[0-9+\-\s()]+$", v):
                raise ValueError("Please enter a valid phone number.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            return v or None
        return v

    @field_validator("google_maps_url", "social_facebook", "social_instagram")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) > 500:
                raise ValueError("URL is too long.")
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError("URL must start with http:// or https://")
        return v
