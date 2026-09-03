from fastapi import Depends, Cookie, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import decode_access_token
from app.utils.exceptions import UnauthorizedError
from app.config import settings


def get_current_admin(
    access_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> str:
    """
    Dependency that validates admin JWT from either HTTP-only cookie or Authorization header.
    Returns admin username if valid.
    """
    token = None

    # Prefer cookie, fall back to Authorization header
    if access_token:
        token = access_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]

    if not token:
        raise UnauthorizedError("Authentication required. Please login.")

    payload = decode_access_token(token)
    if payload is None:
        raise UnauthorizedError("Session expired or invalid. Please login again.")

    username: Optional[str] = payload.get("sub")
    if not username:
        raise UnauthorizedError("Invalid authentication token.")

    if username != settings.ADMIN_USERNAME:
        raise UnauthorizedError("Invalid authentication token.")

    return username
