from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, Literal
from app.database import get_db
from app.models.user import User
from app.schemas.library import LibraryResponse
from app.services.library_service import LibraryService
from app.utils.dependencies import get_current_active_user
import os

router = APIRouter()

@router.get("/all", response_model=LibraryResponse)
def get_all_library_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all library items (samples + generated audio)"""
    result = LibraryService.get_all_items(db, current_user, skip, limit)
    return LibraryResponse(**result)

@router.get("/samples", response_model=LibraryResponse)
def get_samples_only(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get only audio samples"""
    result = LibraryService.get_samples_only(db, current_user, skip, limit)
    return LibraryResponse(**result)

@router.get("/generated", response_model=LibraryResponse)
def get_generated_only(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get only generated audio"""
    result = LibraryService.get_generated_only(db, current_user, skip, limit)
    return LibraryResponse(**result)

@router.delete("/{item_type}/{item_id}")
def delete_library_item(
    item_type: Literal["sample", "generated"],
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an item from library"""
    LibraryService.delete_item(db, item_id, item_type, current_user)
    return {"message": "Item deleted successfully"}

@router.get("/download/{item_type}/{item_id}")
def download_audio_file(
    item_type: Literal["sample", "generated"],
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download an audio file"""
    from app.models.audio_sample import AudioSample
    from app.models.generated_audio import GeneratedAudio
    from fastapi import HTTPException, status
    
    file_path = None
    filename = None
    
    if item_type == "sample":
        sample = db.query(AudioSample).filter(
            AudioSample.sample_id == item_id,
            AudioSample.user_id == current_user.user_id
        ).first()
        
        if not sample:
            raise HTTPException(status_code=404, detail="Sample not found")
        
        file_path = sample.file_path
        filename = sample.file_name
        
    elif item_type == "generated":
        generated = db.query(GeneratedAudio).filter(
            GeneratedAudio.audio_id == item_id,
            GeneratedAudio.user_id == current_user.user_id
        ).first()
        
        if not generated or not generated.output_file_path:
            raise HTTPException(status_code=404, detail="Generated audio not found")
        
        file_path = generated.output_file_path
        filename = f"{generated.model_name}.wav"
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        media_type='application/octet-stream',
        filename=filename
    )
