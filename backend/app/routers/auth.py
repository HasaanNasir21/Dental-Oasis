from fastapi import APIRouter, Response, Depends
from app.schemas.auth import LoginRequest, AdminInfo
from app.schemas.common import SuccessResponse
from app.services.auth_service import authenticate_admin
from app.dependencies import get_current_admin
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

IS_PRODUCTION = settings.APP_ENV == "production"


@router.post("/login", response_model=SuccessResponse[AdminInfo])
def login(request: LoginRequest, response: Response):
    token = authenticate_admin(request.username, request.password)

    # Set cookie for same-domain setups
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="none" if IS_PRODUCTION else "lax",
        secure=IS_PRODUCTION,
        max_age=COOKIE_MAX_AGE,
    )

    # Also return token in response for cross-domain setups
    return SuccessResponse(
        success=True,
        message="Login successful.",
        data=AdminInfo(username=settings.ADMIN_USERNAME),
        token=token,
    )


@router.post("/logout", response_model=SuccessResponse)
def logout(response: Response, _: str = Depends(get_current_admin)):
    response.delete_cookie(
        key=COOKIE_NAME,
        samesite="none" if IS_PRODUCTION else "lax",
        secure=IS_PRODUCTION,
    )
    return SuccessResponse(success=True, message="Logged out successfully.")


@router.get("/me", response_model=SuccessResponse[AdminInfo])
def me(username: str = Depends(get_current_admin)):
    return SuccessResponse(
        success=True,
        message="Authenticated.",
        data=AdminInfo(username=username),
    )
