import logging
import sys
from app.config import settings


def setup_logging():
    log_level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Silence noisy libraries in production
    if settings.APP_ENV != "development":
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    logging.getLogger("passlib").setLevel(logging.WARNING)
