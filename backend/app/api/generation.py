from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.generated_audio import GenerationStatus
from app.schemas.generation import (
    GenerationCreate,
    GenerationResponse,
    GenerationStatusResponse,
    GenerationList
)
from app.services.generation_service import GenerationService
from app.utils.dependencies import get_current_active_user

router = APIRouter()

@router.post("/create", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
def create_generation(
    generation_data: GenerationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new voice generation request
    
    This will:
    1. Validate the audio sample
    2. Create a generation record
    3. Queue the generation task
    4. Return immediately with status 'pending'
    """
    generation = GenerationService.create_generation(db, current_user, generation_data)
    return generation

@router.get("/status/{audio_id}", response_model=GenerationStatusResponse)
def get_generation_status(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check the status of a generation request
    
    Returns:
    - status: pending, processing, completed, or failed
    - progress: 0-100
    - estimated_time_remaining: seconds (if processing)
    - message: human-readable status message
    """
    status_info = GenerationService.get_generation_status(db, audio_id, current_user)
    return status_info

@router.get("/", response_model=GenerationList)
def get_all_generations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[GenerationStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all generated audio for current user
    
    Optional filters:
    - status_filter: Filter by generation status
    """
    generations = GenerationService.get_user_generations(
        db, current_user, skip, limit, status_filter
    )
    total = len(generations)
    
    return GenerationList(generations=generations, total=total)

@router.get("/{audio_id}", response_model=GenerationResponse)
def get_generation(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific generated audio"""
    generation = GenerationService.get_generation_by_id(db, audio_id, current_user)
    return generation

@router.post("/{audio_id}/retry", response_model=GenerationResponse)
def retry_generation(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retry a failed generation
    
    Can only retry generations with status 'failed'
    """
    generation = GenerationService.retry_failed_generation(db, audio_id, current_user)
    return generation

@router.delete("/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_generation(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a generated audio
    
    Cannot delete if status is 'processing'
    """
    GenerationService.delete_generation(db, audio_id, current_user)
    return None
