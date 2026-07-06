import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hair Craft Salon API"
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "haircraft")
    
    # Auth configuration
    MOCK_AUTH: bool = os.getenv("MOCK_AUTH", "true").lower() == "true"
    OWNER_PHONE_NUMBER: str = os.getenv("OWNER_PHONE_NUMBER", "+919999999999")
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    
    # Notifications (can be empty for mock fallback)
    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "Hair Craft Salon <noreply@haircraftsalon.com>")
    
    # Salon Schedule Configurations
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
    
    class Config:
        case_sensitive = True

settings = Settings()
