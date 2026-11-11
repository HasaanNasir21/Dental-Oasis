from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class LabWorkBase(BaseModel):
    patient_name: str
    client_id: Optional[int] = None
    laboratory_id: Optional[int] = None
    work_type: str = "PFM"
    teeth: List[str] = []
    status: str = "Pending"
    work_date: date
    notes: Optional[str] = None

    @field_validator("patient_name")
    @classmethod
    def validate_patient_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Patient name is required.")
        v = v.strip()
        if len(v) > 255:
            raise ValueError("Patient name must not exceed 255 characters.")
        return v

    @field_validator("work_type")
    @classmethod
    def validate_work_type(cls, v: str) -> str:
        valid_types = {"PFM", "3D PFM", "Zirconia", "E-Max", "Dentures", "Aligner", "Inlay", "CC Plate", "Other"}
        if v not in valid_types:
            raise ValueError(f"Work type must be one of: {', '.join(sorted(valid_types))}.")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = {"Pending", "In Progress", "Completed"}
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(sorted(valid_statuses))}.")
        return v

    @field_validator("work_date")
    @classmethod
    def validate_work_date(cls, v: date) -> date:
        if v is None:
            raise ValueError("Work date is required.")
        return v

    @field_validator("teeth")
    @classmethod
    def validate_teeth(cls, v: List[str]) -> List[str]:
        if v is None:
            return []
        # FDI tooth numbers: 11-18, 21-28, 31-38, 41-48
        valid_teeth = set()
        for q in (1, 2, 3, 4):
            for pos in range(1, 9):
                valid_teeth.add(f"{q}{pos}")
        cleaned = []
        for t in v:
            t_str = str(t).strip()
            if t_str not in valid_teeth:
                raise ValueError(f"Invalid tooth number: {t_str}. Use FDI numbers (11-18, 21-28, 31-38, 41-48).")
            cleaned.append(t_str)
        return sorted(set(cleaned))

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Notes must not exceed 5000 characters.")
            return v if v else None
        return v


class LabWorkCreate(LabWorkBase):
    pass


class LabWorkUpdate(BaseModel):
    patient_name: Optional[str] = None
    client_id: Optional[int] = None
    laboratory_id: Optional[int] = None
    work_type: Optional[str] = None
    teeth: Optional[List[str]] = None
    status: Optional[str] = None
    work_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("patient_name")
    @classmethod
    def validate_patient_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 1:
                raise ValueError("Patient name is required.")
            if len(v) > 255:
                raise ValueError("Patient name must not exceed 255 characters.")
        return v

    @field_validator("work_type")
    @classmethod
    def validate_work_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_types = {"PFM", "3D PFM", "Zirconia", "E-Max", "Dentures", "Aligner", "Inlay", "CC Plate", "Other"}
            if v not in valid_types:
                raise ValueError(f"Work type must be one of: {', '.join(sorted(valid_types))}.")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = {"Pending", "In Progress", "Completed"}
            if v not in valid_statuses:
                raise ValueError(f"Status must be one of: {', '.join(sorted(valid_statuses))}.")
        return v

    @field_validator("teeth")
    @classmethod
    def validate_teeth(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            valid_teeth = set()
            for q in (1, 2, 3, 4):
                for pos in range(1, 9):
                    valid_teeth.add(f"{q}{pos}")
            cleaned = []
            for t in v:
                t_str = str(t).strip()
                if t_str not in valid_teeth:
                    raise ValueError(f"Invalid tooth number: {t_str}. Use FDI numbers (11-18, 21-28, 31-38, 41-48).")
                cleaned.append(t_str)
            return sorted(set(cleaned))
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


class WorkTypeSummaryItem(BaseModel):
    work_type: str
    tooth_count: int
    record_count: int


class LabWorkTeethSummary(BaseModel):
    summary: List[WorkTypeSummaryItem]
    total_teeth: int
    total_records: int


class LabWorkOut(BaseModel):
    id: int
    patient_name: str
    client_id: Optional[int] = None
    laboratory_id: Optional[int] = None
    laboratory_name: Optional[str] = None
    work_type: str
    teeth: List[str] = []
    status: str
    work_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LabWorkList(BaseModel):
    id: int
    patient_name: str
    laboratory_id: Optional[int] = None
    laboratory_name: Optional[str] = None
    work_type: str
    teeth: List[str] = []
    status: str
    work_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
