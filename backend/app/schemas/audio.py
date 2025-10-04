from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.audio_sample import UploadType

# Audio Sample Upload
class AudioSampleCreate(BaseModel):
    sample_name: str = Field(..., min_length=1, max_length=100)
    upload_type: UploadType

# Audio Sample Response
class AudioSampleResponse(BaseModel):
    sample_id: int
    user_id: int
    sample_name: str
    file_name: str
    file_path: str
    file_size: Optional[int]
    duration_seconds: Optional[float]
    upload_type: UploadType
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# Audio Sample List
class AudioSampleList(BaseModel):
    samples: list[AudioSampleResponse]
    total: int
