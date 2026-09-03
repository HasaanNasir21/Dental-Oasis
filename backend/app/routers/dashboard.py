from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse
from app.services.dashboard_service import get_dashboard_stats
from app.schemas.appointment import AppointmentOut
from typing import List

router = APIRouter(prefix="/api/admin", tags=["Admin - Dashboard"])


@router.get("/dashboard", response_model=SuccessResponse)
def dashboard(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    stats = get_dashboard_stats(db)
    return SuccessResponse(success=True, message="OK", data=stats)


@router.get("/calendar", response_model=SuccessResponse)
def calendar(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    from datetime import date as dt
    try:
        s = dt.fromisoformat(start_date)
        e = dt.fromisoformat(end_date)
    except ValueError:
        from app.utils.exceptions import ValidationError
        raise ValidationError("Invalid date format. Use YYYY-MM-DD.")

    from app.services.appointment_service import get_calendar_appointments
    appointments = get_calendar_appointments(db, s, e)
    data = [AppointmentOut.model_validate(a).model_dump(mode="json") for a in appointments]
    return SuccessResponse(success=True, message="OK", data=data)
