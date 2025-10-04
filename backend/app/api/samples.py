from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.audio_sample import UploadType
from app.schemas.audio import AudioSampleResponse, AudioSampleList, AudioSampleCreate
from app.services.audio_service import AudioService
from app.utils.dependencies import get_current_active_user
from app.utils.validators import validate_audio_file

router = APIRouter()

@router.post("/upload", response_model=AudioSampleResponse, status_code=status.HTTP_201_CREATED)
async def upload_audio_sample(
    sample_name: str = Form(...),
    upload_type: UploadType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a new audio sample"""
    # Validate file
    validate_audio_file(file)
    
    # Create sample data
    sample_data = AudioSampleCreate(
        sample_name=sample_name,
        upload_type=upload_type
    )
    
    # Save audio sample
    sample = await AudioService.create_audio_sample(db, current_user, sample_data, file)
    
    return sample

@router.get("/", response_model=AudioSampleList)
def get_all_samples(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all audio samples for current user"""
    samples = AudioService.get_user_samples(db, current_user, skip, limit)
    total = len(samples)
    
    return AudioSampleList(samples=samples, total=total)

@router.get("/{sample_id}", response_model=AudioSampleResponse)
def get_sample(
    sample_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific audio sample"""
    sample = AudioService.get_sample_by_id(db, sample_id, current_user)
    return sample

@router.delete("/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sample(
    sample_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an audio sample"""
    AudioService.delete_audio_sample(db, sample_id, current_user)
    return None
