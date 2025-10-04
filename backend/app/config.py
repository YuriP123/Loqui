from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Voice Clone Studio API"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://loqui_user:loqui_db_password@localhost:5432/loqui_db"
    
    # JWT
    SECRET_KEY: str = "secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    UPLOAD_DIR: str = "./app/storage"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_AUDIO_FORMATS: list = ["audio/wav", "audio/mpeg", "audio/mp3"]
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # AI Model (will configure later)
    COLAB_NOTEBOOK_URL: Optional[str] = None
    COLAB_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
