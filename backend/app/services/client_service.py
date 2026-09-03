from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List, Tuple
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate
from app.utils.exceptions import NotFoundError
import logging

logger = logging.getLogger(__name__)


def create_client(db: Session, data: ClientCreate) -> Client:
    client = Client(
        name=data.name,
        contact_number=data.contact_number,
        address=data.address,
        notes=data.notes,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    logger.info(f"Client created: id={client.id}, name={client.name}")
    return client


def get_client_by_id(db: Session, client_id: int) -> Client:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise NotFoundError("Client not found.")
    return client


def update_client(db: Session, client_id: int, data: ClientUpdate) -> Client:
    client = get_client_by_id(db, client_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    logger.info(f"Client updated: id={client_id}")
    return client


def delete_client(db: Session, client_id: int) -> None:
    client = get_client_by_id(db, client_id)
    db.delete(client)
    db.commit()
    logger.info(f"Client deleted: id={client_id}")


def list_clients(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> Tuple[List[Client], int]:
    query = db.query(Client)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Client.name.ilike(like),
                Client.contact_number.ilike(like),
            )
        )

    total = query.count()
    clients = (
        query.order_by(Client.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return clients, total
