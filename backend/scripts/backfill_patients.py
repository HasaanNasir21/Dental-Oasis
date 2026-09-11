"""
One-time script: create patient records for all CONFIRMED appointments
that don't have a client_id yet.

Run from /app on Railway:
    /opt/venv/bin/python -m scripts.backfill_patients
"""
import sys
import os

# Ensure the app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backfill():
    db = SessionLocal()
    try:
        # Find all CONFIRMED appointments with no linked patient
        appointments = (
            db.query(Appointment)
            .filter(
                Appointment.status == AppointmentStatus.CONFIRMED.value,
                Appointment.client_id.is_(None),
            )
            .all()
        )

        logger.info("Found %d confirmed appointments without a patient record.", len(appointments))
        created = 0
        linked = 0

        for appt in appointments:
            # Check if a patient with this contact already exists
            existing = (
                db.query(Client)
                .filter(Client.contact_number == appt.contact_number)
                .first()
            )
            if existing:
                appt.client_id = existing.id
                linked += 1
                logger.info(
                    "Linked appointment id=%s (%s) → existing patient id=%s (%s)",
                    appt.id, appt.patient_name, existing.id, existing.name,
                )
            else:
                client = Client(
                    name=appt.patient_name,
                    contact_number=appt.contact_number,
                    address=appt.address,
                )
                db.add(client)
                db.flush()
                appt.client_id = client.id
                created += 1
                logger.info(
                    "Created patient id=%s (%s) for appointment id=%s",
                    client.id, client.name, appt.id,
                )

        db.commit()
        logger.info("Done. Created: %d new patients, Linked: %d to existing patients.", created, linked)

    except Exception as e:
        db.rollback()
        logger.error("Backfill failed: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    backfill()
