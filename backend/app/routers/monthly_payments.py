from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse
from app.schemas.monthly_summary import (
    MonthlyPaymentSummaryOut,
    MonthlyHistoryResponse,
    MonthlyRolloverResult,
)
from app.services import monthly_payment_service

router = APIRouter(prefix="/api/admin/payments", tags=["Admin - Monthly Payments"])


def _fix_decimal_fields(obj: dict, fields: tuple) -> None:
    """Convert Decimal-serialized string values to floats in-place."""
    for field in fields:
        if obj.get(field) is not None:
            obj[field] = float(obj[field])


@router.get("/history", response_model=SuccessResponse)
def get_payment_history(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """
    Returns current month's live payment snapshot plus last 12 archived months
    clinic-wide totals.
    """
    data = monthly_payment_service.get_monthly_history(db)
    raw = data.model_dump(mode="json")
    # Convert Decimal-serialized strings to floats for proper JSON numbers
    _fix_decimal_fields(raw.get("current_month", {}), ("total_charged", "total_paid", "total_pending"))
    for item in raw.get("archived_months", []):
        _fix_decimal_fields(item, ("total_charged", "total_paid", "total_pending"))
    return SuccessResponse(success=True, message="OK", data=raw)


@router.get("/current-month", response_model=SuccessResponse)
def get_current_month(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Live payment totals for the current calendar month."""
    data = monthly_payment_service.get_current_month_payments(db)
    raw = data.model_dump(mode="json")
    _fix_decimal_fields(raw, ("total_charged", "total_paid", "total_pending"))
    return SuccessResponse(success=True, message="OK", data=raw)


@router.get("/client/{client_id}", response_model=SuccessResponse)
def get_patient_history(
    client_id: int,
    limit: int = Query(default=12, ge=1, le=36),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Archived monthly payment summaries for a single patient."""
    summaries = monthly_payment_service.get_patient_monthly_summaries(db, client_id, limit)
    data = []
    for s in summaries:
        row = MonthlyPaymentSummaryOut.model_validate(s).model_dump(mode="json")
        _fix_decimal_fields(row, ("total_charged", "total_paid", "total_pending"))
        data.append(row)
    return SuccessResponse(success=True, message="OK", data=data)


@router.post("/rollover", response_model=SuccessResponse)
def manual_rollover(
    year: Optional[int] = Query(default=None, ge=2020, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """
    Manually trigger a monthly rollover (archive).
    If year/month are omitted, archives the previous calendar month.
    Safe to re-run — existing rows for the period are replaced.
    """
    result = monthly_payment_service.run_monthly_rollover(db, target_year=year, target_month=month)
    return SuccessResponse(success=True, message=result.message, data=result.model_dump(mode="json"))
