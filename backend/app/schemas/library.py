from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

# Library Item (can be sample or generated)
class LibraryItem(BaseModel):
    id: int
    item_type: Literal["sample", "generated"]
    name: str
    file_path: str
    file_size: Optional[int]
    duration_seconds: Optional[float]
    created_at: datetime
    status: Optional[str] = None  # Only for generated audio
    
    class Config:
        from_attributes = True

# Library Response
class LibraryResponse(BaseModel):
    items: list[LibraryItem]
    total: int
    samples_count: int
    generated_count: int
