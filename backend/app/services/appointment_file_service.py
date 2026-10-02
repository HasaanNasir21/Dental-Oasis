import io
import logging
from typing import List

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models.appointment_file import AppointmentFile
from app.services.appointment_service import get_appointment_by_id

logger = logging.getLogger(__name__)

# ── Allowed MIME types ────────────────────────────────────────────────────────
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_FILES_PER_APPOINTMENT = 10


def _configure_cloudinary() -> None:
    """Configure the Cloudinary SDK from settings (idempotent)."""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def _validate_file(file: UploadFile, content: bytes) -> str:
    """Validate file type and size. Returns 'image' or 'pdf'."""
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 10 MB.",
        )

    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    ext = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""

    if content_type not in ALLOWED_MIME_TYPES or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG, PNG, and PDF files are allowed.",
        )

    return "pdf" if content_type == "application/pdf" else "image"


def upload_appointment_file(
    db: Session,
    appointment_id: int,
    file: UploadFile,
) -> AppointmentFile:
    """Upload a file to Cloudinary and save the reference in the DB."""
    # Ensure appointment exists (raises NotFoundError if not)
    get_appointment_by_id(db, appointment_id)

    # Check per-appointment file limit
    existing_count = (
        db.query(AppointmentFile)
        .filter(AppointmentFile.appointment_id == appointment_id)
        .count()
    )
    if existing_count >= MAX_FILES_PER_APPOINTMENT:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum of {MAX_FILES_PER_APPOINTMENT} files per appointment reached.",
        )

    content = file.file.read()
    file_type = _validate_file(file, content)

    _configure_cloudinary()

    folder = f"dental_oasis/appointments/{appointment_id}"

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            folder=folder,
            resource_type="image",  # "image" handles both images and PDFs
            use_filename=True,
            unique_filename=True,
            # For PDFs, tell Cloudinary to keep the PDF format
            format="pdf" if file_type == "pdf" else None,
        )
    except Exception as exc:
        logger.error(
            "Cloudinary upload failed for appointment %s: %s", appointment_id, exc
        )
        raise HTTPException(
            status_code=502,
            detail="File upload failed. Please try again.",
        )

    record = AppointmentFile(
        appointment_id=appointment_id,
        cloudinary_public_id=result["public_id"],
        file_url=result["secure_url"],
        file_type=file_type,
        file_name=file.filename or "file",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(
        "File uploaded for appointment %s: public_id=%s",
        appointment_id,
        result["public_id"],
    )
    return record


def delete_appointment_file(
    db: Session,
    appointment_id: int,
    file_id: int,
) -> None:
    """Delete a file from Cloudinary and remove the DB record."""
    record = (
        db.query(AppointmentFile)
        .filter(
            AppointmentFile.id == file_id,
            AppointmentFile.appointment_id == appointment_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="File not found.")

    _configure_cloudinary()
    try:
        cloudinary.uploader.destroy(
            record.cloudinary_public_id,
            resource_type="image",  # both images and PDFs are uploaded as image type
        )
    except Exception as exc:
        logger.warning(
            "Cloudinary delete failed for public_id=%s: %s",
            record.cloudinary_public_id,
            exc,
        )
        # Don't block the DB deletion — Cloudinary orphans are acceptable.

    db.delete(record)
    db.commit()
    logger.info(
        "File deleted for appointment %s: file_id=%s", appointment_id, file_id
    )


def list_appointment_files(
    db: Session,
    appointment_id: int,
) -> List[AppointmentFile]:
    """Return all files attached to an appointment, ordered by upload time."""
    return (
        db.query(AppointmentFile)
        .filter(AppointmentFile.appointment_id == appointment_id)
        .order_by(AppointmentFile.uploaded_at)
        .all()
    )
