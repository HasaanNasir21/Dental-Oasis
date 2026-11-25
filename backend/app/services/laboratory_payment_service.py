from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

from app.models.laboratory_payment import LaboratoryPayment
from app.models.laboratory import Laboratory
from app.schemas.laboratory_payment import (
    LaboratoryPaymentCreate, 
    LaboratoryPaymentUpdate,
    MonthlyPaymentSummary,
    LaboratoryPaymentStats,
    LaboratoryPaymentOut
)


def create_payment(db: Session, payment_data: LaboratoryPaymentCreate) -> LaboratoryPayment:
    """Create a new laboratory payment."""
    # Verify laboratory exists
    lab = db.query(Laboratory).filter(Laboratory.id == payment_data.laboratory_id).first()
    if not lab:
        raise ValueError(f"Laboratory with id {payment_data.laboratory_id} not found.")
    
    payment = LaboratoryPayment(
        laboratory_id=payment_data.laboratory_id,
        amount=payment_data.amount,
        payment_date=payment_data.payment_date,
        notes=payment_data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment_by_id(db: Session, payment_id: int) -> Optional[LaboratoryPayment]:
    """Get a payment by ID."""
    return db.query(LaboratoryPayment).filter(LaboratoryPayment.id == payment_id).first()


def update_payment(db: Session, payment_id: int, payment_data: LaboratoryPaymentUpdate) -> Optional[LaboratoryPayment]:
    """Update an existing payment."""
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        return None
    
    update_dict = payment_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(payment, key, value)
    
    db.commit()
    db.refresh(payment)
    return payment


def delete_payment(db: Session, payment_id: int) -> bool:
    """Delete a payment."""
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        return False
    
    db.delete(payment)
    db.commit()
    return True


def get_monthly_payments(
    db: Session, 
    laboratory_id: int, 
    year: int, 
    month: int
) -> MonthlyPaymentSummary:
    """Get all payments for a specific laboratory in a specific month."""
    payments = (
        db.query(LaboratoryPayment)
        .filter(
            LaboratoryPayment.laboratory_id == laboratory_id,
            extract('year', LaboratoryPayment.payment_date) == year,
            extract('month', LaboratoryPayment.payment_date) == month
        )
        .order_by(LaboratoryPayment.payment_date.desc())
        .all()
    )
    
    total = sum(p.amount for p in payments) if payments else Decimal(0)
    
    # Convert to output schema with laboratory name
    payment_outs = []
    for p in payments:
        payment_outs.append(LaboratoryPaymentOut(
            id=p.id,
            laboratory_id=p.laboratory_id,
            laboratory_name=p.laboratory.name if p.laboratory else None,
            amount=p.amount,
            payment_date=p.payment_date,
            notes=p.notes,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ))
    
    return MonthlyPaymentSummary(
        year=year,
        month=month,
        total_amount=total,
        payment_count=len(payments),
        payments=payment_outs,
    )


def get_current_month_payments(db: Session, laboratory_id: int) -> MonthlyPaymentSummary:
    """Get payments for the current month."""
    now = datetime.now()
    return get_monthly_payments(db, laboratory_id, now.year, now.month)


def get_payment_stats(db: Session, laboratory_id: int) -> LaboratoryPaymentStats:
    """Get overall payment statistics for a laboratory."""
    lab = db.query(Laboratory).filter(Laboratory.id == laboratory_id).first()
    if not lab:
        raise ValueError(f"Laboratory with id {laboratory_id} not found.")
    
    # Current month
    now = datetime.now()
    current_month = get_monthly_payments(db, laboratory_id, now.year, now.month)
    
    # All time
    all_time_result = (
        db.query(
            func.sum(LaboratoryPayment.amount).label('total'),
            func.count(LaboratoryPayment.id).label('count')
        )
        .filter(LaboratoryPayment.laboratory_id == laboratory_id)
        .first()
    )
    
    all_time_total = all_time_result.total if all_time_result.total else Decimal(0)
    all_time_count = all_time_result.count if all_time_result.count else 0
    
    return LaboratoryPaymentStats(
        laboratory_id=laboratory_id,
        laboratory_name=lab.name,
        current_month_total=current_month.total_amount,
        current_month_count=current_month.payment_count,
        all_time_total=all_time_total,
        all_time_count=all_time_count,
    )


def get_all_payments_for_laboratory(
    db: Session, 
    laboratory_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> list[LaboratoryPayment]:
    """Get all payments for a laboratory with optional date filtering."""
    query = db.query(LaboratoryPayment).filter(LaboratoryPayment.laboratory_id == laboratory_id)
    
    if from_date:
        query = query.filter(LaboratoryPayment.payment_date >= from_date)
    if to_date:
        query = query.filter(LaboratoryPayment.payment_date <= to_date)
    
    return query.order_by(LaboratoryPayment.payment_date.desc()).all()
