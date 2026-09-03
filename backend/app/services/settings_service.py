from sqlalchemy.orm import Session
from app.models.clinic_setting import ClinicSetting
from app.schemas.clinic import ClinicSettingsUpdate, ClinicInfoOut, OpeningHours
from app.config import settings as env_settings


def _row_to_out(row: ClinicSetting) -> ClinicInfoOut:
    return ClinicInfoOut(
        name=row.name,
        address=row.address,
        phone=row.phone or None,
        whatsapp=row.whatsapp or None,
        email=row.email or None,
        google_maps_url=row.google_maps_url or None,
        opening_hours=OpeningHours(
            monday_saturday=row.hours_monday_saturday,
            sunday=row.hours_sunday,
        ),
        social_facebook=row.social_facebook or None,
        social_instagram=row.social_instagram or None,
    )


def _defaults() -> dict:
    return {
        "name": env_settings.CLINIC_NAME,
        "address": env_settings.CLINIC_ADDRESS,
        "phone": env_settings.CLINIC_PHONE or None,
        "whatsapp": env_settings.CLINIC_WHATSAPP or None,
        "email": env_settings.CLINIC_EMAIL or None,
        "google_maps_url": env_settings.CLINIC_GOOGLE_MAPS_URL or None,
        "hours_monday_saturday": "5:00 PM - 9:00 PM",
        "hours_sunday": "Closed",
        "social_facebook": None,
        "social_instagram": None,
    }


def get_or_create_settings(db: Session) -> ClinicSetting:
    row = db.query(ClinicSetting).order_by(ClinicSetting.id.asc()).first()
    if row:
        return row
    defaults = _defaults()
    row = ClinicSetting(
        name=defaults["name"],
        address=defaults["address"],
        phone=defaults["phone"],
        whatsapp=defaults["whatsapp"],
        email=defaults["email"],
        google_maps_url=defaults["google_maps_url"],
        hours_monday_saturday=defaults["hours_monday_saturday"],
        hours_sunday=defaults["hours_sunday"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_clinic_info(db: Session) -> ClinicInfoOut:
    return _row_to_out(get_or_create_settings(db))


def update_clinic_settings(db: Session, data: ClinicSettingsUpdate) -> ClinicInfoOut:
    row = get_or_create_settings(db)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return _row_to_out(row)
