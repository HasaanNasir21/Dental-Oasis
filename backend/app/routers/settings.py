from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.common import SuccessResponse
from app.schemas.clinic import ClinicInfoOut, ClinicSettingsUpdate
from app.services import settings_service

router = APIRouter(prefix="/api/admin/settings", tags=["Admin - Settings"])


@router.get("", response_model=SuccessResponse[ClinicInfoOut])
def get_settings(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """Return non-sensitive clinic settings. Never includes ADMIN_PASSWORD or SECRET_KEY."""
    data = settings_service.get_clinic_info(db)
    return SuccessResponse(success=True, message="OK", data=data)


@router.patch("", response_model=SuccessResponse[ClinicInfoOut])
def update_settings(
    payload: ClinicSettingsUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    data = settings_service.update_clinic_settings(db, payload)
    return SuccessResponse(success=True, message="Settings updated successfully.", data=data)
