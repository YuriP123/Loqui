from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.generated_audio import GenerationStatus

# Generation Request
class GenerationCreate(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    sample_id: int = Field(..., gt=0)
    model_name: str = Field(..., min_length=1, max_length=100)
    script_text: str = Field(..., min_length=1, max_length=5000)

# Generation Response
class GenerationResponse(BaseModel):
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    audio_id: int
    user_id: int
    sample_id: Optional[int]
    model_name: str
    script_text: str
    output_file_path: Optional[str]
    file_size: Optional[int]
    duration_seconds: Optional[float]
    status: GenerationStatus
    generated_at: datetime
    completed_at: Optional[datetime]

# Generation Status Check
class GenerationStatusResponse(BaseModel):
    audio_id: int
    status: GenerationStatus
    progress: Optional[int] = None  # 0-100
    message: Optional[str] = None
    
# Generation List
class GenerationList(BaseModel):
    generations: list[GenerationResponse]
    total: int
