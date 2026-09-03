from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ServiceBase(BaseModel):
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Service name is required.")
        return v.strip()

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Slug is required.")
        return v.strip().lower()


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceOut(BaseModel):
    id: int
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ServiceList(BaseModel):
    id: int
    name: str
    slug: str
    short_description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}
