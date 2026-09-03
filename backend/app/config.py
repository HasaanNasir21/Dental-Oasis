from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_ENV: str = "development"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/dental_oasis"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "dental_oasis"
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"

    # Security
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Admin Credentials
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "CHANGE_ME"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Clinic Info
    CLINIC_NAME: str = "Dental Oasis"
    CLINIC_ADDRESS: str = "270 Block E2, Johar Town, Lahore"
    CLINIC_PHONE: str = ""
    CLINIC_WHATSAPP: str = ""
    CLINIC_EMAIL: str = ""
    CLINIC_GOOGLE_MAPS_URL: str = "https://maps.google.com/?q=270+Block+E2+Johar+Town+Lahore"
    CLINIC_TIMEZONE: str = "Asia/Karachi"
    CLINIC_OPEN_TIME: str = "17:00"
    CLINIC_CLOSE_TIME: str = "21:00"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
