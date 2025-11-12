from pydantic_settings import BaseSettings
from typing import Optional
import warnings

class Settings(BaseSettings):
    """
    Application Settings
    
    ⚠️ PRODUCTION WARNING:
    - Change SECRET_KEY before deploying
    - Set DEBUG=False in production
    - Use strong database passwords
    - Configure proper CORS origins
    """
    
    # App
    APP_NAME: str = "AI Voice Clone Studio API"
    DEBUG: bool = True  # ⚠️ SET TO FALSE IN PRODUCTION
    
    # Database
    DATABASE_URL: str = "postgresql://voiceclone_user:voiceclone_pass@localhost:5432/voiceclone_db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"  # ⚠️ CHANGE THIS!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    UPLOAD_DIR: str = "./app/storage"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_AUDIO_FORMATS: list = [
        "audio/wav", 
        "audio/mpeg", 
        "audio/mp3",
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/ogg",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/m4a"
    ]
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Replicate AI
    REPLICATE_API_TOKEN: Optional[str] = None
    REPLICATE_MODEL: str = "resemble-ai/chatterbox"
    
    # Redis/Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file

settings = Settings()

# Production security warnings
if settings.DEBUG and settings.SECRET_KEY == "your-secret-key-change-in-production-min-32-chars":
    warnings.warn(
        "\n⚠️  SECURITY WARNING:\n"
        "Using default SECRET_KEY! This is INSECURE for production.\n"
        "Generate a secure key: python -c 'import secrets; print(secrets.token_urlsafe(32))'\n",
        RuntimeWarning,
        stacklevel=2
    )
