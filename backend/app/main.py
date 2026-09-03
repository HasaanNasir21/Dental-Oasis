from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from app.config import settings
from app.limiter import limiter
from app.utils.logging_config import setup_logging
from app.routers import auth, public, appointments, clients, dashboard, services, testimonials, settings as settings_router

setup_logging()
logger = logging.getLogger(__name__)

MAX_REQUEST_BYTES = 1_000_000


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_BYTES:
            return JSONResponse(
                status_code=413,
                content={"success": False, "message": "Request too large.", "data": None},
            )
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


app = FastAPI(
    title="Dental Oasis API",
    description="Backend API for Dental Oasis dental clinic management system.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(dashboard.router)
app.include_router(appointments.router)
app.include_router(clients.router)
app.include_router(services.router)
app.include_router(testimonials.router)
app.include_router(settings_router.router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail), "data": None},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    messages = []
    for error in errors:
        field = " -> ".join(str(loc) for loc in error["loc"] if loc != "body")
        msg = error["msg"]
        if field:
            messages.append(f"{field}: {msg}")
        else:
            messages.append(msg)
    message = "; ".join(messages) if messages else "Validation error."
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": message, "data": None, "errors": errors},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unexpected error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "An unexpected error occurred. Please try again.", "data": None},
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Dental Oasis API"}


@app.on_event("startup")
async def startup_event():
    logger.info("Dental Oasis API starting up | ENV=%s | TZ=%s", settings.APP_ENV, settings.CLINIC_TIMEZONE)
    try:
        from app.database import engine
        with engine.connect() as conn:
            logger.info("Database connection successful.")
    except Exception as e:
        logger.error("Database connection failed: %s", e)
