from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class TestimonialBase(BaseModel):
    name: str
    content: str
    rating: int = 5
    is_published: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required.")
        v = v.strip()
        if len(v) > 255:
            raise ValueError("Name must not exceed 255 characters.")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Content is required.")
        v = v.strip()
        if len(v) > 2000:
            raise ValueError("Content must not exceed 2000 characters.")
        return v

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5.")
        return v


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    rating: Optional[int] = None
    is_published: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 255:
                raise ValueError("Name must not exceed 255 characters.")
        return v

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5.")
        return v


class TestimonialOut(BaseModel):
    id: int
    name: str
    content: str
    rating: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
