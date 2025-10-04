from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class QueueStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class GenerationQueue(Base):
    __tablename__ = "generation_queue"
    
    queue_id = Column(Integer, primary_key=True, index=True)
    audio_id = Column(Integer, ForeignKey("generated_audio.audio_id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, default=0)
    status = Column(Enum(QueueStatus), default=QueueStatus.QUEUED)
    queued_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
    retry_count = Column(Integer, default=0)
    
    # Relationships
    audio = relationship("GeneratedAudio", back_populates="queue")
