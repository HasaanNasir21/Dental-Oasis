from fastapi import HTTPException, status


class AppException(HTTPException):
    pass


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=message)


class ConflictError(AppException):
    def __init__(self, message: str = "Resource already exists."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=message)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation error."):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(AppException):
    def __init__(self, message: str = "Access denied."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=message)


class AppointmentConflictError(AppException):
    def __init__(self, message: str = "This appointment time is already occupied."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=message)


class OutsideClinicHoursError(AppException):
    def __init__(self, message: str = "Selected time is outside clinic hours."):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message)


class SundayAppointmentError(AppException):
    def __init__(self, message: str = "The clinic is closed on Sundays."):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message)
