from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class GenerationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class GeneratedAudio(Base):
    __tablename__ = "generated_audio"
    
    audio_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    sample_id = Column(Integer, ForeignKey("audio_samples.sample_id", ondelete="SET NULL"))
    model_name = Column(String(100), nullable=False)
    script_text = Column(Text, nullable=False)
    output_file_path = Column(String(500))
    file_size = Column(Integer)
    duration_seconds = Column(Float)
    status = Column(Enum(GenerationStatus), default=GenerationStatus.PENDING)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="generated_audios")
    sample = relationship("AudioSample", back_populates="generated_audios")
    queue = relationship("GenerationQueue", back_populates="audio", uselist=False)
