from app.config import settings
from app.utils.security import verify_password, create_access_token
from app.utils.exceptions import UnauthorizedError
import hmac
import logging

logger = logging.getLogger(__name__)


def _secure_equal(left: str, right: str) -> bool:
    if len(left) != len(right):
        hmac.compare_digest(left.encode("utf-8"), left.encode("utf-8"))
        return False
    return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))


def _password_matches(plain: str, configured: str) -> bool:
    """Compare against a bcrypt hash or plaintext env password. Never log the secret."""
    if configured.startswith("$2"):
        return verify_password(plain, configured)
    return _secure_equal(plain, configured)


def authenticate_admin(username: str, password: str) -> str:
    """Authenticate admin credentials and return a JWT token."""
    username_ok = _secure_equal(username, settings.ADMIN_USERNAME)
    password_ok = _password_matches(password, settings.ADMIN_PASSWORD)

    if not (username_ok and password_ok):
        logger.warning("Failed admin login attempt for username: %s", username)
        raise UnauthorizedError("Invalid username or password.")

    logger.info("Admin login successful: %s", username)
    token = create_access_token(data={"sub": username})
    return token
