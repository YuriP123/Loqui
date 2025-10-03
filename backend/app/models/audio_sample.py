from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UploadType(str, enum.Enum):
    RECORDED = "recorded"
    UPLOADED = "uploaded"

class AudioSample(Base):
    __tablename__ = "audio_samples"
    
    sample_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    sample_name = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)  # in bytes
    duration_seconds = Column(Float)
    upload_type = Column(Enum(UploadType), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audio_samples")
    generated_audios = relationship("GeneratedAudio", back_populates="sample")
