from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse
from app.models.laboratory_payment import LaboratoryPayment
from app.schemas.laboratory_payment import (
    LaboratoryPaymentCreate,
    LaboratoryPaymentUpdate,
    LaboratoryPaymentOut,
    MonthlyPaymentSummary,
    LaboratoryPaymentStats,
)
from app.services import laboratory_payment_service

router = APIRouter(prefix="/api/admin/laboratory-payments", tags=["Admin - Laboratory Payments"])


@router.post("", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: LaboratoryPaymentCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Create a new payment for a laboratory."""
    try:
        created = laboratory_payment_service.create_payment(db, payment)
        output = LaboratoryPaymentOut(
            id=created.id,
            laboratory_id=created.laboratory_id,
            laboratory_name=created.laboratory.name if created.laboratory else None,
            amount=created.amount,
            payment_date=created.payment_date,
            notes=created.notes,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )
        return SuccessResponse(success=True, message="Payment created successfully.", data=output)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{payment_id}", response_model=SuccessResponse)
def get_payment(
    payment_id: int, 
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Get a payment by ID."""
    payment = laboratory_payment_service.get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    
    output = LaboratoryPaymentOut(
        id=payment.id,
        laboratory_id=payment.laboratory_id,
        laboratory_name=payment.laboratory.name if payment.laboratory else None,
        amount=payment.amount,
        payment_date=payment.payment_date,
        notes=payment.notes,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )
    return SuccessResponse(success=True, message="OK", data=output)


@router.put("/{payment_id}", response_model=SuccessResponse)
def update_payment(
    payment_id: int,
    payment_data: LaboratoryPaymentUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Update a payment."""
    updated = laboratory_payment_service.update_payment(db, payment_id, payment_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    
    output = LaboratoryPaymentOut(
        id=updated.id,
        laboratory_id=updated.laboratory_id,
        laboratory_name=updated.laboratory.name if updated.laboratory else None,
        amount=updated.amount,
        payment_date=updated.payment_date,
        notes=updated.notes,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )
    return SuccessResponse(success=True, message="Payment updated successfully.", data=output)


@router.delete("/{payment_id}", response_model=SuccessResponse)
def delete_payment(
    payment_id: int, 
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Delete a payment."""
    deleted = laboratory_payment_service.delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    
    return SuccessResponse(success=True, message="Payment deleted successfully.", data=None)


@router.get("/laboratory/{laboratory_id}/monthly", response_model=SuccessResponse)
def get_monthly_payments(
    laboratory_id: int,
    year: int = Query(..., description="Year (e.g., 2024)"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Get all payments for a laboratory in a specific month."""
    try:
        summary = laboratory_payment_service.get_monthly_payments(db, laboratory_id, year, month)
        return SuccessResponse(success=True, message="OK", data=summary)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/laboratory/{laboratory_id}/current-month", response_model=SuccessResponse)
def get_current_month_payments(
    laboratory_id: int, 
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Get payments for the current month for a laboratory."""
    summary = laboratory_payment_service.get_current_month_payments(db, laboratory_id)
    return SuccessResponse(success=True, message="OK", data=summary)


@router.get("/laboratory/{laboratory_id}/stats", response_model=SuccessResponse)
def get_payment_stats(
    laboratory_id: int, 
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Get payment statistics for a laboratory."""
    try:
        stats = laboratory_payment_service.get_payment_stats(db, laboratory_id)
        return SuccessResponse(success=True, message="OK", data=stats)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/summaries/monthly", response_model=SuccessResponse)
def get_all_monthly_summaries(
    year: int = Query(..., description="Year (e.g., 2024)"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Get monthly payment summaries for all laboratories."""
    summaries = laboratory_payment_service.get_all_monthly_summaries(db, year, month)
    return SuccessResponse(success=True, message="OK", data=summaries)
