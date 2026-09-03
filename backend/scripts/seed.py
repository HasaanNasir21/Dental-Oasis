"""Development seed script.

Usage (from backend/):
    python -m scripts.seed
    python -m scripts.seed --clients
    python -m scripts.seed --testimonials   # fake testimonials, unpublished by default unless --publish

Never run --clients or --testimonials against a production database with real patients.
"""

from __future__ import annotations

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.service import Service
from app.models.client import Client
from app.models.testimonial import Testimonial
from app.models.clinic_setting import ClinicSetting
from app.config import settings
from app.services.settings_service import get_or_create_settings

SERVICES = [
    {
        "name": "Checkup",
        "slug": "checkup",
        "short_description": "A dental examination of the teeth, gums, mouth and overall oral health. Initial checkup is free.",
        "description": "A dental checkup is an examination of the teeth, gums, mouth and overall oral health. It can help identify cavities, gum problems, tooth damage, plaque, tartar, infection and other oral health concerns. The initial checkup at Dental Oasis is free. Treatment suitability depends on professional examination.",
        "image_url": "/services/checkup.jpg",
    },
    {
        "name": "Dental Implant",
        "slug": "dental-implant",
        "short_description": "A fixed option for replacing missing teeth using an implant-supported restoration.",
        "description": "Dental implants are used to replace missing teeth. An implant can support a dental restoration such as a crown. Potential benefits include replacing missing teeth, improving chewing, supporting appearance and providing a fixed tooth replacement option. Suitability depends on factors such as bone condition, gum health and overall oral health.",
        "image_url": "/services/dental-implant.jpg",
    },
    {
        "name": "Braces",
        "slug": "braces",
        "short_description": "Orthodontic appliances that gradually move teeth over time.",
        "description": "Braces are orthodontic appliances that gradually move teeth. They may help with crooked teeth, crowding, gaps and certain bite problems. Treatment duration varies. A consultation is required to assess suitability.",
        "image_url": "/services/braces.jpg",
    },
    {
        "name": "Invisible Aligners",
        "slug": "invisible-aligners",
        "short_description": "Clear removable trays designed to gradually move teeth.",
        "description": "Invisible aligners are clear removable trays designed to gradually move teeth. Potential advantages include being less noticeable, removable, easier cleaning and convenient for some patients. Not every orthodontic case is suitable for aligners.",
        "image_url": "/services/invisible-aligners.jpg",
    },
    {
        "name": "Root Canal Treatment",
        "slug": "root-canal-treatment",
        "short_description": "Treatment that may be used when the pulp inside a tooth is infected or inflamed.",
        "description": "Root canal treatment may be used when the pulp inside a tooth is infected or severely inflamed. Possible symptoms include toothache, sensitivity, pain when chewing, swelling and infection. Treatment aims to clean and restore the affected tooth.",
        "image_url": "/services/root-canal-treatment.jpg",
    },
    {
        "name": "Removable Denture",
        "slug": "removable-denture",
        "short_description": "A removable appliance that can replace missing teeth.",
        "description": "A removable denture can replace missing teeth. It may help with chewing, speech and appearance. It can be removed for cleaning.",
        "image_url": "/services/removable-denture.jpg",
    },
    {
        "name": "Cast Partial Denture",
        "slug": "cast-partial-denture",
        "short_description": "A removable appliance with a supportive framework for multiple missing teeth.",
        "description": "A cast partial denture is a removable dental appliance used to replace multiple missing teeth. It uses a framework designed to provide support and stability.",
        "image_url": "/services/cast-partial-denture.jpg",
    },
    {
        "name": "E-Max",
        "slug": "e-max",
        "short_description": "A dental ceramic commonly used for crowns and other restorations.",
        "description": "E-Max is a dental ceramic commonly used for crowns and other restorations. It is known for its natural-looking appearance. Suitability depends on professional examination.",
        "image_url": "/services/e-max.jpg",
    },
    {
        "name": "Zirconia",
        "slug": "zirconia",
        "short_description": "A strong ceramic material used for dental crowns and restorations.",
        "description": "Zirconia is a strong ceramic material used for dental crowns and restorations. Potential advantages include strength, durability and a natural appearance.",
        "image_url": "/services/zirconia.jpg",
    },
    {
        "name": "PFM",
        "slug": "pfm",
        "short_description": "Porcelain fused to metal crowns combining a metal framework with tooth-colored porcelain.",
        "description": "PFM means Porcelain Fused to Metal. It combines a metal framework with tooth-colored porcelain. Suitability is discussed during consultation.",
        "image_url": "/services/pfm.jpg",
    },
    {
        "name": "Veneers",
        "slug": "veneers",
        "short_description": "Thin coverings placed over the front surface of teeth for certain cosmetic concerns.",
        "description": "Veneers are thin coverings placed over the front surface of teeth. They may be used for certain cosmetic concerns such as discoloration, shape irregularities and minor gaps. Not every case is suitable for veneers.",
        "image_url": "/services/veneers.jpg",
    },
    {
        "name": "Tooth Extraction",
        "slug": "tooth-extraction",
        "short_description": "Removal of a tooth when clinically indicated.",
        "description": "Tooth extraction means removing a tooth. Possible reasons may include severe damage, certain infections, impacted wisdom teeth, severe decay and selected orthodontic reasons.",
        "image_url": "/services/tooth-extraction.jpg",
    },
    {
        "name": "Scaling & Polishing",
        "slug": "scaling-polishing",
        "short_description": "Professional cleaning to remove tartar and surface stains. Not the same as whitening.",
        "description": "Scaling removes hardened plaque and tartar. Polishing helps remove surface stains and gives teeth a cleaner feel. It is not the same as professional whitening.",
        "image_url": "/services/scaling-polishing.jpg",
    },
    {
        "name": "Dental Filling",
        "slug": "dental-filling",
        "short_description": "Restores a tooth affected by decay or certain minor damage.",
        "description": "A filling restores a tooth affected by decay or certain minor damage. The dentist removes affected tooth structure and restores the area using an appropriate material.",
        "image_url": "/services/dental-filling.jpg",
    },
]


def seed_services(db: Session) -> None:
    for item in SERVICES:
        existing = db.query(Service).filter(Service.slug == item["slug"]).first()
        if existing:
            for key, value in item.items():
                setattr(existing, key, value)
        else:
            db.add(Service(**item, is_active=True))
    db.commit()
    print(f"Seeded {len(SERVICES)} services.")


def seed_clients(db: Session) -> None:
    fake_clients = [
        {"name": "Ali Raza", "contact_number": "03000000000", "address": "Johar Town, Lahore", "notes": "Fake development record."},
        {"name": "Ahmed Khan", "contact_number": "03111111111", "address": "Wapda Town, Lahore", "notes": "Fake development record."},
        {"name": "Sara Malik", "contact_number": "03222222222", "address": "Model Town, Lahore", "notes": "Fake development record."},
    ]
    for item in fake_clients:
        existing = db.query(Client).filter(Client.contact_number == item["contact_number"]).first()
        if not existing:
            db.add(Client(**item))
    db.commit()
    print("Seeded fake development clients.")


def seed_testimonials(db: Session, publish: bool) -> None:
    samples = [
        {"name": "Sample Patient A", "content": "This is a sample development testimonial and does not represent a real patient.", "rating": 5},
        {"name": "Sample Patient B", "content": "This is a sample development testimonial used only for layout testing.", "rating": 4},
    ]
    for item in samples:
        existing = db.query(Testimonial).filter(Testimonial.name == item["name"]).first()
        if not existing:
            db.add(Testimonial(**item, is_published=publish))
    db.commit()
    print(f"Seeded fake testimonials (published={publish}).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Dental Oasis development data.")
    parser.add_argument("--clients", action="store_true", help="Add fake clients (development only).")
    parser.add_argument("--testimonials", action="store_true", help="Add fake unpublished testimonials.")
    parser.add_argument("--publish", action="store_true", help="Publish fake testimonials (still clearly labelled as samples).")
    args = parser.parse_args()

    if settings.APP_ENV == "production" and (args.clients or args.testimonials):
        print("Refusing to seed fake patient/testimonial data while APP_ENV=production.")
        sys.exit(1)

    db = SessionLocal()
    try:
        get_or_create_settings(db)
        seed_services(db)
        if args.clients:
            seed_clients(db)
        if args.testimonials:
            seed_testimonials(db, publish=args.publish)
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
